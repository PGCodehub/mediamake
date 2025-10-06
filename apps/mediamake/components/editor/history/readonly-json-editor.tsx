"use client"

import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ReadOnlyJsonEditorProps {
    value: any;
    height?: string;
    className?: string;
}

export const ReadOnlyJsonEditor: React.FC<ReadOnlyJsonEditorProps> = ({
    value,
    height = "300px",
    className = "",
}) => {
    const { theme } = useTheme();
    const [jsonString, setJsonString] = useState("");

    // Initialize JSON string from value
    useEffect(() => {
        try {
            const formatted = JSON.stringify(value, null, 2);
            setJsonString(formatted);
        } catch (err) {
            setJsonString("Invalid JSON format");
        }
    }, [value]);

    const editorTheme = theme === "dark" ? "vs-dark" : "light";

    return (
        <div className={`relative ${className}`}>
            <Editor
                height={height}
                defaultLanguage="json"
                value={jsonString}
                theme={editorTheme}
                options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                    },
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    readOnly: true,
                    domReadOnly: true,
                    contextmenu: false,
                    selectOnLineNumbers: false,
                    selectionHighlight: false,
                    cursorStyle: "line",
                    cursorBlinking: "solid",
                    cursorWidth: 0,
                    bracketPairColorization: {
                        enabled: true,
                    },
                }}
                className="border rounded-md"
            />
        </div>
    );
};
