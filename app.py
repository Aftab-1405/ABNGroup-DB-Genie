import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import mysql.connector
import google.generativeai as genai
from functools import wraps
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor
import threading
import uuid
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'DB_Genie_secret'

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("static/firebase-adminsdk.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            app.logger.debug('User not in session, redirecting to auth.')
            return redirect(url_for('auth'))
        app.logger.debug(f'User in session: {session["user"]}')
        return f(*args, **kwargs)
    return decorated_function

# MySQL configuration
db_config = {
    'user': 'root',
    'password': 'Password@1405',
    'host': 'localhost',
    'port': 0000,
    'database': None
}

# Thread-local storage for database connections
thread_local = threading.local()
executor = ThreadPoolExecutor(max_workers=32)  # Configure thread pool executor

# Configure the Gemini API
GEMINI_API_KEY = 'API_KEY-GOES_HERE'
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro"
)

chat_sessions = {}

def pass_user_input_to_Gemini(prompt, conversation_id):
    if conversation_id not in chat_sessions:
        conversation = db.collection('conversations').document(conversation_id).get()
        if conversation.exists:
            messages = conversation.to_dict().get('messages', [])
            history = [
                {"role": "user" if msg["sender"] == "user" else "model", "parts": [msg["content"]]}
                for msg in messages
            ]
            chat_sessions[conversation_id] = model.start_chat(history=history)
        else:
            chat_sessions[conversation_id] = model.start_chat(history=[])
    chat_session = chat_sessions[conversation_id]
    response = chat_session.send_message({"role": "user", "parts": [prompt]})
    return response.text

def notify_to_Gemini(message, conversation_id):
    app.logger.debug(f'Notifying to Gemini: {message}')
    if conversation_id in chat_sessions:
        chat_sessions[conversation_id].send_message(message)
    else:
        app.logger.warning(f'No chat session found for conversation_id: {conversation_id}')

def get_db_connection():
    if not hasattr(thread_local, 'connection'):
        thread_local.connection = mysql.connector.connect(**db_config)
    return thread_local.connection

def fetch_database_info(db_name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]

        db_info = f"The database {db_name} has been selected. It contains the following tables:\n"
        detailed_info = ""

        for table in tables:
            cursor.execute(f"DESCRIBE {table}")
            schema = cursor.fetchall()
            db_info += f"Table {table}:\n"
            detailed_info += f"Table {table}:\n"
            for column in schema:
                db_info += f"  {column[0]} {column[1]}\n"
                detailed_info += f"  {column[0]} {column[1]}\n"

            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            detailed_info += f"  count: {row_count}\n"

            cursor.execute(f"SELECT * FROM {table} LIMIT 5")
            rows = cursor.fetchall()
            if rows:
                detailed_info += "  Sample data:\n"
                for row in rows:
                    detailed_info += f"    {row}\n"

        return db_info, detailed_info
    except mysql.connector.Error as err:
        return None, str(err)

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/auth')
def auth():
    session.clear()
    app.logger.debug('Session cleared on /auth')
    return render_template('auth.html')

@app.route('/index')
@login_required
def index():
    return render_template('index.html')

@app.route('/set_session', methods=['POST'])
def set_session():
    data = request.get_json()
    session['user'] = data['user']
    session['conversation_id'] = str(uuid.uuid4())
    app.logger.debug(f'Session set for user: {session["user"]} with conversation_id: {session["conversation_id"]}')
    return jsonify({'status': 'success', 'conversation_id': session['conversation_id']})

@app.route('/check_session', methods=['GET'])
def check_session():
    if 'user' in session:
        return jsonify({'status': 'session_active', 'conversation_id': session.get('conversation_id')})
    else:
        return jsonify({'status': 'no_session'})

@app.route('/pass_userinput_to_gemini', methods=['POST'])
def pass_userinput_to_gemini():
    data = request.get_json()
    prompt = data['prompt']
    conversation_id = data.get('conversation_id', session.get('conversation_id'))
    app.logger.debug(f'Received prompt: {prompt} for conversation: {conversation_id}')
    try:
        future = executor.submit(pass_user_input_to_Gemini, prompt, conversation_id)
        response = future.result()
        app.logger.debug(f'Gemini response: {response}')
        
        # Store the conversation in Firestore
        store_conversation(conversation_id, 'user', prompt)
        store_conversation(conversation_id, 'ai', response)
        
        return jsonify({'status': 'success', 'response': response})
    except Exception as e:
        app.logger.error(f'Error querying Gemini: {e}')
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/get_conversations', methods=['GET'])
@login_required
def get_conversations():
    user_id = session['user']
    conversations = db.collection('conversations').where('user_id', '==', user_id).get()
    conversation_list = []
    for conv in conversations:
        conv_data = conv.to_dict()
        conversation_list.append({
            'id': conv.id,
            'timestamp': conv_data['timestamp'],
            'preview': conv_data['messages'][0]['content'][:50] + '...'  # Preview of the first message
        })
    return jsonify({'status': 'success', 'conversations': conversation_list})

@app.route('/get_conversation/<conversation_id>', methods=['GET'])
@login_required
def get_conversation(conversation_id):
    conversation = db.collection('conversations').document(conversation_id).get()
    if conversation.exists:
        session['conversation_id'] = conversation_id  # Update session to current conversation
        conv_data = conversation.to_dict()
        history = [
            {"role": "user" if msg["sender"] == "user" else "model", "parts": [msg["content"]]}
            for msg in conv_data.get('messages', [])
        ]
        chat_sessions[conversation_id] = model.start_chat(history=history)
        return jsonify({'status': 'success', 'conversation': conv_data})
    else:
        return jsonify({'status': 'error', 'message': 'Conversation not found'})

@app.route('/new_conversation', methods=['POST'])
@login_required
def new_conversation():
    conversation_id = str(uuid.uuid4())
    session['conversation_id'] = conversation_id
    chat_sessions[conversation_id] = model.start_chat(history=[])
    return jsonify({'status': 'success', 'conversation_id': conversation_id})

def store_conversation(conversation_id, sender, message):
    user_id = session['user']
    conversation_ref = db.collection('conversations').document(conversation_id)
    
    if not conversation_ref.get().exists:
        conversation_ref.set({
            'user_id': user_id,
            'timestamp': datetime.now(),
            'messages': []
        })
    
    conversation_ref.update({
        'messages': firestore.ArrayUnion([{
            'sender': sender,
            'content': message,
            'timestamp': datetime.now()
        }])
    })

@app.route('/get_databases', methods=['GET'])
def get_databases():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES")
        databases = [db[0] for db in cursor.fetchall()]
        return jsonify({'status': 'success', 'databases': databases})
    except mysql.connector.Error as err:
        return jsonify({'status': 'error', 'message': str(err)})

@app.route('/connect_db', methods=['POST'])
def connect_db():
    data = request.get_json()
    db_name = data.get('db_name')
    conversation_id = session.get('conversation_id')  # Get the conversation ID from the session

    if not db_name:
        return jsonify({'status': 'error', 'message': 'No database selected'})

    db_config['database'] = db_name
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]

        db_info, detailed_info = fetch_database_info(db_name)

        if conversation_id not in chat_sessions:
            chat_sessions[conversation_id] = model.start_chat(history=[])
        chat_session = chat_sessions[conversation_id]  # Retrieve the chat session for the current conversation

        chat_session.send_message(db_info)
        chat_session.send_message(detailed_info)

        return jsonify({'status': 'connected', 'message': f'Connected to database {db_name}'})
    except mysql.connector.Error as err:
        return jsonify({'status': 'error', 'message': str(err)})

@app.route('/run_sql_query', methods=['POST'])
def run_sql_query():
    try:
        conn = get_db_connection()
        data = request.get_json()
        sql_query = data['sql_query']
        conversation_id = session.get('conversation_id')  # Get the conversation ID from the session
        cursor = conn.cursor(buffered=True)
        cursor.execute(sql_query)

        if cursor.description:  # This means it's a SELECT query
            rows = cursor.fetchall()
            result = {
                'fields': cursor.column_names,
                'rows': rows
            }
            notify_to_Gemini(f'SELECT query executed on {db_config["database"]}. Retrieved {len(rows)} rows from table(s) {cursor.column_names}.', conversation_id)
            return jsonify({'status': 'success', 'result': result, 'message': 'Query executed successfully. Data retrieved.'})
        else:  # This means it's an INSERT, UPDATE, DELETE, etc.
            conn.commit()
            table_name = sql_query.split()[2]  # Extracting table name from the query
            notify_to_Gemini(f'Query executed on {db_config["database"]} in table {table_name}. Affected rows: {cursor.rowcount}. Query: {sql_query}', conversation_id)
            return jsonify({'status': 'success', 'message': f'Query executed successfully. Affected rows: {cursor.rowcount}'})
    except mysql.connector.Error as err:
        notify_to_Gemini(f'Error executing query on {db_config["database"]}: {str(err)}. Query: {sql_query}', conversation_id)
        return jsonify({'status': 'error', 'message': str(err)})

if __name__ == '__main__':
    app.run(debug=True)
