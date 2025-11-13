import json
import os
from openai import OpenAI

client = OpenAI()

# Carregar pt-BR como base
with open('pt-BR.json', 'r', encoding='utf-8') as f:
    pt_br = json.load(f)

# Idiomas para traduzir
languages = {
    'en-US': 'English (United States)',
    'es-ES': 'Spanish (Spain)',
    'fr-FR': 'French (France)',
    'de-DE': 'German (Germany)',
    'it-IT': 'Italian (Italy)',
    'ja-JP': 'Japanese (Japan)',
    'zh-CN': 'Chinese (Simplified, China)',
    'ko-KR': 'Korean (South Korea)',
    'ru-RU': 'Russian (Russia)',
    'ar-SA': 'Arabic (Saudi Arabia)',
    'hi-IN': 'Hindi (India)'
}

for lang_code, lang_name in languages.items():
    print(f"Traduzindo para {lang_name}...")
    
    prompt = f"""Translate this JSON from Brazilian Portuguese to {lang_name}.
Keep the JSON structure exactly the same, only translate the values (text strings).
Do NOT translate keys, only values.
Return ONLY valid JSON, no explanations.

{json.dumps(pt_br, ensure_ascii=False, indent=2)}"""
    
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    translated = response.choices[0].message.content.strip()
    
    # Remover markdown se houver
    if translated.startswith('```'):
        translated = '\n'.join(translated.split('\n')[1:-1])
    
    # Salvar
    with open(f'{lang_code}.json', 'w', encoding='utf-8') as f:
        f.write(translated)
    
    print(f"✅ {lang_code} salvo!")

print("\n✅ Todas as traduções concluídas!")
