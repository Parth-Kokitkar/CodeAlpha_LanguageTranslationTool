from whisper_model import model
from flask import Flask, render_template, request, jsonify, send_from_directory
from deep_translator import GoogleTranslator 
from gtts import gTTS
import json
import os

app = Flask(__name__)

HISTORY_FILE = "history.json"


def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []

    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except:
        return []


def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as file:
        json.dump(
            history,
            file,
            ensure_ascii=False,
            indent=4
        )
@app.route("/")
def home():

    history = load_history()

    return render_template(
        "index.html",
        history=history[:5]
    )

@app.route("/audio/<filename>")
def audio(filename):

    return send_from_directory(
        "audio",
        filename
    )


@app.route("/translate", methods=["POST"])
def translate():

    data = request.get_json()

    text = data.get("text", "")
    source_lang = data.get("source_lang", "english")
    target_lang = data.get("target_lang", "hindi")

    try:

        translated_text = GoogleTranslator(
            source=source_lang,
            target=target_lang
        ).translate(text)

        history = load_history()

        history.insert(
            0,
            {
                "input": text,
                "output": translated_text
            }
        )

        save_history(history)

        return jsonify({
            "success": True,
            "translated_text": translated_text
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route("/transcribe", methods=["POST"])
def transcribe_audio():

    try:

        audio_file = request.files["audio"]

        audio_path = "audio/temp.wav"

        audio_file.save(audio_path)

        result = model.transcribe(
            audio_path,
            language="en",
            fp16=False
        )

        recognized_text = result["text"]

        return jsonify({
            "success": True,
            "text": recognized_text
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route("/speak", methods=["POST"])
def speak():

    try:

        data = request.get_json()

        text = data.get("text", "")
        language = data.get("lang", "english")

        LANGUAGE_MAP = {
            "english": "en",
            "hindi": "hi",
            "marathi": "mr",
            "spanish": "es",
            "french": "fr",
            "german": "de",
            "italian": "it",
            "portuguese": "pt",
            "russian": "ru",
            "japanese": "ja",
            "korean": "ko",
            "arabic": "ar",
            "turkish": "tr",
            "urdu": "ur",
            "bengali": "bn",
            "gujarati": "gu",
            "tamil": "ta",
            "telugu": "te",
            "punjabi": "pa",
            "chinese (simplified)": "zh-CN"
        }

        gtts_lang = LANGUAGE_MAP.get(
            language,
            "en"
        )

        tts = gTTS(
            text=text,
            lang=gtts_lang
        )

        audio_file = "audio/output.mp3"

        tts.save(audio_file)

        return jsonify({
            "success": True,
            "audio": "/audio/output.mp3"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })
    
if __name__ == "__main__":
    app.run(debug=True)