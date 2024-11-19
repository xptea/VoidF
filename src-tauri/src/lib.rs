use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileItem {
    name: String,
    path: String,
    is_dir: bool,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn list_directory(path: &str) -> Result<Vec<FileItem>, String> {
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut items = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            let path_buf = entry.path();
            let is_dir = path_buf.is_dir();
            let name = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();
            let path = path_buf.to_str().unwrap_or("").to_string();

            items.push(FileItem { name, path, is_dir });
        }
    }

    Ok(items)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, list_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
