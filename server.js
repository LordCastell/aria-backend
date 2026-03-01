const express = require('express');
const app = express();

// CORS abierto para todos los origenes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

const ARIA_SYSTEM = `Eres "Aria", una asistente virtual empatica y calida de la pagina Camino Azul, especializada en apoyar a familias colombianas con hijos con autismo (TEA).

Tu mision es:
- Acompanar emocionalmente a las familias con calidez y paciencia
- Orientar sobre como acceder a terapias a traves de la EPS en Colombia (fonoaudiologia, terapia ocupacional, psicologia, ABA)
- Explicar procesos como: diagnostico, autorizaciones medicas, derechos de peticion y tutelas cuando los niegan servicios
- Sugerir actividades y rutinas sencillas y practicas para hacer en casa
- Usar lenguaje simple, calido y sin tecnicismos medicos

Reglas importantes:
- NUNCA reemplaces el consejo medico o terapeutico profesional
- Si la familia esta en crisis emocional, prioriza escuchar y validar sus sentimientos antes de dar informacion
- Si no sabes algo, dilo honestamente y sugiere donde puede encontrar esa informacion
- Siempre termina con un siguiente paso concreto y alcanzable
- Responde siempre en espanol colombiano, con calidez y empatia
- Tus respuestas deben ser claras, no muy largas, y faciles de leer`;

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Mensajes invalidos' });
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    if (data.error) return res.status(500).json({ error: data.error.message });
    const reply = data.candidates[0].content.parts[0].text;
    res.json({ reply });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Error al conectar con Gemini' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'Aria backend activo OK' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Aria backend corriendo en puerto ${PORT}`));
