/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/*.html", "./static/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        cursive: ["Dancing Script", "cursive"],
      },
      maxHeight: {
        48: "12rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 255, 255, 0.5)",
      },
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "slow-rotate": "rotate 10s linear infinite",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "100%",
            width: "100%",
            overflowWrap: "break-word",
            wordWrap: "break-word",
            hyphens: "auto",
            "ol > li": {
              marginTop: "0",
              marginBottom: "0",
            },
            "ul > li": {
              marginTop: "0",
              marginBottom: "0",
            },
            p: {
              marginTop: "0",
              marginBottom: "0",
            },
            h1: {
              marginTop: "0",
              marginBottom: "0",
            },
            h2: {
              marginTop: "0",
              marginBottom: "0",
            },
            h3: {
              marginTop: "0",
              marginBottom: "0",
            },
            h4: {
              marginTop: "0",
              marginBottom: "0",
            },
            h5: {
              marginTop: "0",
              marginBottom: "0",
            },
            h6: {
              marginTop: "0",
              marginBottom: "0",
            },
            pre: {
              marginTop: "1",
              marginBottom: "2",
              backgroundColor: theme("colors.neutral.100"),
              color: theme("colors.neutral.900"),
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontFamily: theme("fontFamily.mono"),
              fontSize: theme("fontSize.sm")[0],
              lineHeight: theme("lineHeight.relaxed"),
              padding: theme("spacing.4"),
              borderRadius: theme("borderRadius.lg"),
              maxWidth: "100%",
              "@media (max-width: 640px)": {
                fontSize: theme("fontSize.xs")[0],
              },
              "&::-webkit-scrollbar": {
                display: "none",
              },
              code: {
                backgroundColor: "transparent",
                borderWidth: "0",
                borderRadius: "0",
                padding: "0",
                fontWeight: "400",
                color: "inherit",
                fontSize: "inherit",
                fontFamily: "inherit",
                lineHeight: "inherit",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              },
              ".hljs-comment,.hljs-quote": {
                color: theme("colors.neutral.500"),
                fontStyle: "italic",
              },
              ".hljs-keyword,.hljs-selector-tag,.hljs-subst": {
                color: theme("colors.blue.600"),
                fontWeight: "700",
              },
              ".hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr":
                {
                  color: theme("colors.green.600"),
                },
              ".hljs-string,.hljs-doctag": {
                color: theme("colors.red.600"),
              },
              ".hljs-title,.hljs-section,.hljs-selector-id": {
                color: theme("colors.purple.600"),
                fontWeight: "700",
              },
              ".hljs-subst": {
                fontWeight: "normal",
              },
              ".hljs-type,.hljs-class .hljs-title": {
                color: theme("colors.yellow.600"),
                fontWeight: "700",
              },
              ".hljs-tag,.hljs-name,.hljs-attribute": {
                color: theme("colors.blue.600"),
                fontWeight: "normal",
              },
              ".hljs-regexp,.hljs-link": {
                color: theme("colors.green.500"),
              },
              ".hljs-symbol,.hljs-bullet": {
                color: theme("colors.pink.600"),
              },
              ".hljs-built_in,.hljs-builtin-name": {
                color: theme("colors.cyan.600"),
              },
              ".hljs-meta": {
                color: theme("colors.gray.600"),
                fontWeight: "700",
              },
              ".hljs-deletion": {
                backgroundColor: theme("colors.red.100"),
              },
              ".hljs-addition": {
                backgroundColor: theme("colors.green.100"),
              },
              ".hljs-emphasis": {
                fontStyle: "italic",
              },
              ".hljs-strong": {
                fontWeight: "700",
              },
            },
            a: {
              color: theme("colors.blue.500"),
              textDecoration: "none",
              wordBreak: "break-all",
              "&:hover": {
                textDecoration: "underline",
                boxShadow: `0 0 5px ${theme("colors.blue.500")}`,
              },
            },
            code: {
              backgroundColor: "transparent",
              color: theme("colors.blue.500"),
              padding: "2px 4px",
              borderRadius: "4px",
              wordBreak: "break-all",
              "&.dark": {
                backgroundColor: "transparent",
                color: theme("colors.blue.400"),
              },
            },
            table: {
              display: "block",
              overflowX: "auto",
              maxWidth: "100%",
            },
            img: {
              maxWidth: "100%",
              height: "auto",
            },
          },
        },
        sm: {
          css: {
            fontSize: "0.875rem",
          },
        },
        lg: {
          css: {
            maxWidth: "none",
            width: "100%",
          },
        },
        xl: {
          css: {
            maxWidth: "none",
            width: "100%",
          },
        },
        "2xl": {
          css: {
            maxWidth: "none",
            width: "100%",
          },
        },
        "prose-full": {
          css: {
            maxWidth: "none",
            width: "100%",
          },
        },
        "prose-narrow": {
          css: {
            maxWidth: "45ch",
            width: "100%",
          },
        },
        "prose-wide": {
          css: {
            maxWidth: "80ch",
            width: "100%",
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function ({ addUtilities, addComponents }) {
      addUtilities({
        ".text-shadow-glow": {
          textShadow: "0 0 10px rgba(255, 255, 255, 0.7)",
        },
      });
      addComponents({
        ".prose": {
          "& *": {
            overflowWrap: "break-word",
            wordWrap: "break-word",
          },
        },
      });
    },
  ],
};
