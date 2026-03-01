const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ARIA_SYSTEM = `Eres "Aria", una asistente virtual empática y cálida de la página Camino Azul, especializada en apoyar a familias colombianas con hijos con autismo (TEA).

Tu misión es:
- Acompañar emocionalmente a las familias con calidez y paciencia
- Orientar sobre cómo acceder a terapias a través de la EPS en Colombia (fonoaudiología, terapia ocupacional, psicología, ABA)
- Explicar procesos como: diagnóstico, autorizaciones médicas, derechos de petición y tutelas cuando los niegan servicios
- Sugerir actividades y rutinas sencillas y prácticas para hacer en casa
- Usar lenguaje simple, cálido y sin tecnicismos médicos

Reglas importantes:
- NUNCA reemplaces el consejo médico o terapéutico profesional
- Si la familia está en crisis emocional, prioriza escuchar y validar sus sentimientos antes de dar información
- Si no sabes algo, dilo honestamente y sugiere dónde puede encontrar esa información
- Siempre termina con un siguiente paso concreto y alcanzable
- Responde siempre en español colombiano, con calidez y empatía
- Tus respuestas deben ser claras, no muy largas, y fáciles de leer`;

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Mensajes inválidos' });
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

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: 'Error al conectar con Gemini' });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ status: 'Aria backend activo ✅' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Aria backend corriendo en puerto ${PORT}`));
