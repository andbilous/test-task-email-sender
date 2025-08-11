import DB from '../db/index.js';
import AIService from '../services/aiService.js';

export default async function routes(fastify, options) {
  await fastify.register(import('@fastify/cors'), {
    origin: ['http://localhost:3000'],
    credentials: true
  });

  fastify.get('/ping', async (request, reply) => {
    return 'pong\n';
  });

  fastify.get('/api/emails', async (request, reply) => {
    try {
      const emails = await DB.getEmails();
      return { emails };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to fetch emails' });
    }
  });

  fastify.get('/api/emails/:id', async (request, reply) => {
    try {
      const email = await DB.getEmailById(request.params.id);
      if (!email) {
        reply.code(404).send({ error: 'Email not found' });
        return;
      }
      return { email };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to fetch email' });
    }
  });

  fastify.post('/api/emails', async (request, reply) => {
    try {
      const { to, cc, bcc, subject, body } = request.body;
      const email = await DB.createEmail({ to, cc, bcc, subject, body });
      reply.code(201).send({ email });
    } catch (error) {
      reply.code(500).send({ error: 'Failed to create email' });
    }
  });

  fastify.put('/api/emails/:id', async (request, reply) => {
    try {
      const { to, cc, bcc, subject, body } = request.body;
      const email = await DB.updateEmail(request.params.id, { to, cc, bcc, subject, body });
      if (!email) {
        reply.code(404).send({ error: 'Email not found' });
        return;
      }
      return { email };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to update email' });
    }
  });

  fastify.delete('/api/emails/:id', async (request, reply) => {
    try {
      const deleted = await DB.deleteEmail(request.params.id);
      if (deleted === 0) {
        reply.code(404).send({ error: 'Email not found' });
        return;
      }
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Failed to delete email' });
    }
  });

  fastify.post('/api/emails/generate', async (request, reply) => {
    try {
      const { prompt, to, assistantType } = request.body;
      
      if (!prompt || !to) {
        reply.code(400).send({ error: 'Prompt and recipient email are required' });
        return;
      }

      const streamGenerator = await AIService.streamEmailByType(prompt, to, assistantType);
      
      reply.type('text/plain');
      
      for await (const chunk of streamGenerator) {
        reply.raw.write(chunk);
      }
      
      reply.raw.end();
      
    } catch (error) {
      console.error('AI generation error:', error);
      reply.code(500).send({ error: 'Failed to generate email' });
    }
  });

  fastify.post('/api/emails/generate-fallback', async (request, reply) => {
    try {
      const { prompt, to } = request.body;
      
      if (!prompt || !to) {
        reply.code(400).send({ error: 'Prompt and recipient email are required' });
        return;
      }

      const businessDomain = to.split('@')[1] || 'your business';
      
      return {
        subject: `Quick question about ${businessDomain}`,
        body: `Hi,\n\nRegarding: ${prompt}\n\nWould love to discuss this further.\n\nBest regards`,
        type: 'ai-generated'
      };
      
    } catch (error) {
      console.error('Fallback generation error:', error);
      reply.code(500).send({ error: 'Failed to generate email' });
    }
  });
}
