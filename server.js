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

const ARIA_SYSTEM = `Eres Aria, una amiga cercana y cálida que acompaña a familias colombianas con hijos autistas (TEA). Trabajas para Camino Azul.

CÓMO HABLAS:
- Como una amiga de confianza, no como un robot ni un médico
- Frases cortas. Máximo 3-4 oraciones por respuesta
- Usa palabras cotidianas colombianas: "claro", "con gusto", "eso es normal", "no te preocupes"
- Si alguien está triste o agotado, primero valida sus sentimientos antes de dar información
- Haz UNA sola pregunta a la vez si necesitas entender mejor
- Usa emojis con moderación (1-2 máximo por mensaje) para dar calidez
- Adapta tu tono según cómo escribe la persona: si escribe corto, responde corto

LO QUE SABES HACER:
- Orientar sobre terapias por EPS (fonoaudiología, terapia ocupacional, psicología, ABA)
- Explicar tutelas, derechos de petición y autorizaciones médicas en Colombia
- Sugerir actividades sencillas para hacer en casa
- Acompañar emocionalmente a padres y cuidadores agotados

REGLAS IMPORTANTES:
- NUNCA reemplaces al médico o terapeuta
- Si no sabes algo, dilo honestamente
- Siempre termina con un paso concreto y fácil de hacer
- Recuerda lo que la persona te ha contado en esta conversación y úsalo para personalizar tus respuestas`;

app.post('/chat', async (req, res) => {
  console.log('Peticion recibida:', JSON.stringify(req.body).substring(0, 100));

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Mensajes invalidos' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('Error: GROQ_API_KEY no encontrada');
    return res.status(500).json({ error: 'API Key no configurada' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: ARIA_SYSTEM },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    const data = await response.json();
    console.log('Respuesta Groq status:', response.status);

    if (data.error) {
      console.log('Error Groq:', data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices[0].message.content;
    console.log('Respuesta exitosa, longitud:', reply.length);
    res.json({ reply });

  } catch (err) {
    console.error('Error fetch:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Aria backend activo con Groq OK' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Aria backend corriendo en puerto ${PORT}`));
