import 'dotenv/config';

async function registerCommands() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado!');
    process.exit(1);
  }

  const commands = [
    {
      command: 'start',
      description: 'Iniciar bot e ver instruções'
    },
    {
      command: 'diario',
      description: 'Relatório diário de trading'
    },
    {
      command: 'semanal',
      description: 'Relatório semanal de trading'
    },
    {
      command: 'mensal',
      description: 'Relatório mensal de trading'
    },
    {
      command: 'contas',
      description: 'Listar todas as suas contas'
    }
  ];

  console.log('📝 Registrando comandos no bot do Telegram...');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commands })
      }
    );

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Comandos registrados com sucesso!');
      console.log('\nComandos disponíveis:');
      commands.forEach(cmd => {
        console.log(`  /${cmd.command} - ${cmd.description}`);
      });
    } else {
      console.error('❌ Erro ao registrar comandos:', data);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

registerCommands();
