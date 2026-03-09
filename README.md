# DeepSeek Chat Exporter (Markdown, PDF & Image)

This is a Tampermonkey/Violentmonkey script for exporting DeepSeek chat conversations in Markdown, PDF, and image formats. The script adds three export buttons to the top-right corner of the DeepSeek chat interface for quick and easy conversation saving.

## English / improved version

This repository now includes the maintained English/improved variant originally developed in <https://github.com/endolith/DeepSeek-Chat-Exporter>, with several modifications:

- Extract original markdown for Assistant messages from React instead of incompletely translating from HTML back to markdown.  Exports are more accurate and properly formatted.
- Add a switch for whether to convert LaTeX delimiters to $$ format or not, and fix the conversion to correctly handle cases like LaTex inside lists, nested blockquotes, etc.
- Remove `<strong>` tags in markdown output, and use **User**/**Assistant** headers instead, with reasoning tokens in a quote block, like the website.
- Make the interface less obtrusive and remove animations, etc.
- Add chat title to exported files, and to filenames.
- Use ISO 8601 timestamps for filenames instead of UNIX.

---

## Features

- **Export to Markdown**: Save chat history as Markdown files, perfect for notes and documentation.
- **Export to PDF**: Save conversations as PDF files for printing or sharing.
- **Export to Image**: Capture chat history as image files for easy viewing and sharing.
- **Automatic Segmentation**: Automatically segments user messages, assistant responses, and thought processes for clear readability.
- **Enhanced Layout**: Optimized formatting for PDF export with customizable styles.
- **One-Click Operation**: Export with a single click, no complex operations needed.

---

## Installation

1. Ensure you have a userscript manager installed (like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)).
2. Click the following link to install the script:
   - [DeepSeek Chat Exporter Script Installation Link](https://github.com/blueberrycongee/DeepSeek-Chat-Exporter/raw/refs/heads/main/deepseek_chat_exporter.user.js)
3. After installation, refresh your DeepSeek chat page.
4. Three export buttons will appear in the top-right corner, indicating successful script installation.

---

## Usage

1. Open the DeepSeek chat page (`https://chat.deepseek.com/`).
2. Look for the export buttons in the top-right corner:
   - **➡️📝**: Click to download a `.md` file.
   - **➡️🖨**: Click to open the print preview window, select "Save as PDF".
   - **➡️🖼️**: Click to capture the current chat history as a `.png` image.
   - **⚙️**: Click to access settings:
     - **LaTeX Delimiter Conversion**: Toggle between keeping original `\( \)` and `\[ \]` delimiters or converting to `$ $` and `$$ $$` format
3. Markdown and PNG exports include the chat title (if any) and timestamps in ISO 8601 format in the filename, and the PDF print window uses the same title where the browser supports it. Examples:
   - `DeepSeek_Chat_Title_2024-03-21_15_30_45.md`
   - `DeepSeek_Chat_Title_2024-03-21_15_30_45.pdf`
   - `DeepSeek_Chat_Title_2024-03-21_15_30_45.png`

---

## File Format Details

### Markdown Format

- **User Messages**: Begin with `## User`, followed by the message content.
- **Assistant Responses**: Begin with `## Assistant`, followed by the response.
- **Thought Process**: Begin with `### Thought Process`, followed by blockquoted reasoning process.
- **LaTeX Math**: Either preserved in original `\( \)` and `\[ \]` format, or converted to `$ $` and `$$ $$` format based on settings
- Sections are separated by `---`.

Example:

```markdown
## User

Hello, can you help me write some code?

---

## Assistant

### Thought Process
> This is a request for code writing assistance.
> Let me help with programming guidance.

Of course! Please tell me what kind of code you need.
```

### PDF Format

- **User Messages**: Displayed with "User" heading in normal text.
- **Assistant Responses**: Displayed with "Assistant" heading in green text.
- **Thought Process**: Displayed with "Thought Process" heading in gray italic text, with a gray left border.
- Sections separated by horizontal lines.

### Image Format

- Exports as a `.png` screenshot of the chat history, including the chat interface and all conversations, ideal for quick sharing or saving.

---

## Important Notes

1. Ensure your browser allows pop-ups for PDF export functionality.
2. For long conversations, consider using landscape orientation when printing PDFs for best results.
3. For image export, ensure the page displays all content completely before exporting.
4. Script updates may be needed if the page structure changes to match new DOM structures.

---

## Feedback and Contributions

If you encounter issues or have suggestions for improvements, please submit an Issue or Pull Request at <https://github.com/blueberrycongee/DeepSeek-Chat-Exporter>.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
