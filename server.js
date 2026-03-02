const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

const ARIA_SYSTEM = `Eres "Aria", asistente virtual empatica de Camino Azul, especializada en apoyar familias colombianas con hijos con autismo (TEA). Acompana emocionalmente, orienta sobre terapias EPS, explica tutelas y derechos de peticion, sugiere actividades en casa. Usa lenguaje simple y calido. Nunca reemplaces al medico. Responde en espanol colombiano.`;

app.post('/chat', async (req, res) => {
  console.log('Peticion recibida:', JSON.stringify(req.body).substring(0, 100));
  
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    console.log('Error: mensajes invalidos');
    return res.status(400).json({ error: 'Mensajes invalidos' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('Error: API Key no encontrada');
    return res.status(500).json({ error: 'API Key no configurada' });
  }

  console.log('API Key encontrada, longitud:', apiKey.length);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ARIA_SYSTEM }] },
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: { temperature: 0.72, maxOutputTokens: 700 }
        })
      }
    );

    const data = await response.json();
    console.log('Respuesta Gemini status:', response.status);
    
    if (data.error) {
      console.log('Error Gemini:', data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates[0].content.parts[0].text;
    console.log('Respuesta exitosa, longitud:', reply.length);
    res.json({ reply });

  } catch (err) {
    console.error('Error fetch:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Aria backend activo OK' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Aria backend corriendo en puerto ${PORT}`));
