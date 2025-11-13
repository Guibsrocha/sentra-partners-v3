/**
 * Frases motivacionais para notificações do Telegram
 * Suporta 12 idiomas
 */

export type PhraseType = 'profit' | 'loss' | 'open' | 'copy_open' | 'copy_profit' | 'report_profit' | 'report_loss' | 'sale' | 'renewal';

export const motivationalPhrases: Record<string, Record<PhraseType, string[]>> = {
  "pt-BR": {
    profit: [
      "Parabéns pelo gain! 🎉",
      "Excelente execução! 🏆",
      "Consistência é a chave! 💎",
      "Mais um green! 🟢",
      "Lucro garantido! 💵"
    ],
    loss: [
      "Faz parte do jogo! 💪",
      "Próximo trade será melhor! 🎯",
      "Stop loss é proteção! 🛡️",
      "Mantenha a cabeça erguida! 🔥",
      "Perdas fazem parte do sucesso! 📈"
    ],
    open: [
      "Disciplina sempre! 💪",
      "Foco e paciência! 🎯",
      "Siga seu plano! 📋",
      "Confiança no processo! ⚡",
      "Gestão de risco em primeiro lugar! 🛡️"
    ],
    copy_open: [
      "Trade copiado com sucesso! ✅",
      "Seguindo os melhores! 🌟",
      "Copy trade ativado! 🚀",
      "Confiança no provider! 👑",
      "Automação funcionando! ⚙️"
    ],
    copy_profit: [
      "Excelente resultado! 🎉",
      "Copy trade lucrativo! 💎",
      "Provider entregou! 🏆",
      "Lucro automatizado! 💵",
      "Estratégia vencedora! 🌟"
    ],
    report_profit: [
      "Hoje você não vai dormir conta... Vai dormir contando dinheiro com esses {value} de lucro! 💰😁",
      "Continue assim que logo você compra uma Ferrari! 🏎️💨",
      "Semana verde! {value} de lucro. Tá voando! 🚀",
      "Hoje você foi bem... Muito bem! {value} de lucro! 👏😎"
    ],
    report_loss: [
      "Você é muito bom... Em perder dinheiro. Hoje você perdeu {value}. 😔",
      "Finalizando o dia com prejuízo de {value}... Fiquei decepcionado, mas amanhã recuperamos. 😞",
      "Hoje não foi seu dia... {value} de prejuízo. Mas calma, amanhã é outro dia! 💪"
    ],
    sale: [
      "Venda aprovada! 1M É LOGO ALI! 🚀🎯",
      "Venda aprovada! Mais dinheiro no bolso! 💰",
      "Venda confirmada! Bora vender mais! 🔥"
    ],
    renewal: [
      "Renovação confirmada! Mais {value} no bolso! 💵",
      "Cliente renovou! Fidelidade é tudo! 🤝",
      "Renovação aprovada! Continue assim! ✅"
    ]
  },
  
  "en-US": {
    profit: [
      "Congrats on the gain! 🎉",
      "Excellent execution! 🏆",
      "Consistency is key! 💎",
      "Another green! 🟢",
      "Profit secured! 💵"
    ],
    loss: [
      "Part of the game! 💪",
      "Next trade will be better! 🎯",
      "Stop loss is protection! 🛡️",
      "Keep your head up! 🔥",
      "Losses are part of success! 📈"
    ],
    open: [
      "Discipline always! 💪",
      "Focus and patience! 🎯",
      "Follow your plan! 📋",
      "Trust the process! ⚡",
      "Risk management first! 🛡️"
    ],
    copy_open: [
      "Trade copied successfully! ✅",
      "Following the best! 🌟",
      "Copy trade activated! 🚀",
      "Trust in the provider! 👑",
      "Automation working! ⚙️"
    ],
    copy_profit: [
      "Excellent result! 🎉",
      "Profitable copy trade! 💎",
      "Provider delivered! 🏆",
      "Automated profit! 💵",
      "Winning strategy! 🌟"
    ],
    report_profit: [
      "Today you won't sleep counting sheep... You'll sleep counting money with {value} profit! 💰😁",
      "Keep it up and you'll buy a Ferrari soon! 🏎️💨",
      "Green week! {value} profit. You're flying! 🚀",
      "Today you did well... Very well! {value} profit! 👏😎"
    ],
    report_loss: [
      "You're very good... At losing money. Today you lost {value}. 😔",
      "Ending the day with {value} loss... I'm disappointed, but tomorrow we recover. 😞",
      "Today wasn't your day... {value} loss. But calm down, tomorrow is another day! 💪"
    ],
    sale: [
      "Sale approved! 1M IS COMING! 🚀🎯",
      "Sale approved! More money in your pocket! 💰",
      "Sale confirmed! Let's sell more! 🔥"
    ],
    renewal: [
      "Renewal confirmed! {value} more in your pocket! 💵",
      "Client renewed! Loyalty is everything! 🤝",
      "Renewal approved! Keep it up! ✅"
    ]
  },

  "es-ES": {
    profit: [
      "¡Felicidades por la ganancia! 🎉",
      "¡Excelente ejecución! 🏆",
      "¡La consistencia es clave! 💎",
      "¡Otro verde! 🟢",
      "¡Beneficio asegurado! 💵"
    ],
    loss: [
      "¡Parte del juego! 💪",
      "¡El próximo trade será mejor! 🎯",
      "¡El stop loss es protección! 🛡️",
      "¡Mantén la cabeza en alto! 🔥",
      "¡Las pérdidas son parte del éxito! 📈"
    ],
    open: [
      "¡Disciplina siempre! 💪",
      "¡Enfoque y paciencia! 🎯",
      "¡Sigue tu plan! 📋",
      "¡Confía en el proceso! ⚡",
      "¡Gestión de riesgo primero! 🛡️"
    ],
    copy_open: [
      "¡Trade copiado con éxito! ✅",
      "¡Siguiendo a los mejores! 🌟",
      "¡Copy trade activado! 🚀",
      "¡Confianza en el proveedor! 👑",
      "¡Automatización funcionando! ⚙️"
    ],
    copy_profit: [
      "¡Excelente resultado! 🎉",
      "¡Copy trade rentable! 💎",
      "¡El proveedor cumplió! 🏆",
      "¡Beneficio automatizado! 💵",
      "¡Estrategia ganadora! 🌟"
    ],
    report_profit: [
      "Hoy no vas a dormir contando ovejas... ¡Vas a dormir contando dinero con {value} de ganancia! 💰😁",
      "¡Sigue así y pronto comprarás un Ferrari! 🏎️💨",
      "¡Semana verde! {value} de ganancia. ¡Estás volando! 🚀",
      "Hoy lo hiciste bien... ¡Muy bien! ¡{value} de ganancia! 👏😎"
    ],
    report_loss: [
      "Eres muy bueno... En perder dinero. Hoy perdiste {value}. 😔",
      "Terminando el día con {value} de pérdida... Estoy decepcionado, pero mañana recuperamos. 😞",
      "Hoy no fue tu día... {value} de pérdida. ¡Pero calma, mañana es otro día! 💪"
    ],
    sale: [
      "¡Venta aprobada! ¡1M ESTÁ CERCA! 🚀🎯",
      "¡Venta aprobada! ¡Más dinero en tu bolsillo! 💰",
      "¡Venta confirmada! ¡Vamos a vender más! 🔥"
    ],
    renewal: [
      "¡Renovación confirmada! ¡{value} más en tu bolsillo! 💵",
      "¡Cliente renovó! ¡La lealtad lo es todo! 🤝",
      "¡Renovación aprobada! ¡Sigue así! ✅"
    ]
  },

  "fr-FR": {
    profit: [
      "Félicitations pour le gain! 🎉",
      "Excellente exécution! 🏆",
      "La cohérence est la clé! 💎",
      "Un autre vert! 🟢",
      "Profit sécurisé! 💵"
    ],
    loss: [
      "Ça fait partie du jeu! 💪",
      "Le prochain trade sera meilleur! 🎯",
      "Le stop loss est une protection! 🛡️",
      "Garde la tête haute! 🔥",
      "Les pertes font partie du succès! 📈"
    ],
    open: [
      "Discipline toujours! 💪",
      "Concentration et patience! 🎯",
      "Suivez votre plan! 📋",
      "Faites confiance au processus! ⚡",
      "Gestion des risques d'abord! 🛡️"
    ],
    copy_open: [
      "Trade copié avec succès! ✅",
      "Suivre les meilleurs! 🌟",
      "Copy trade activé! 🚀",
      "Confiance dans le fournisseur! 👑",
      "Automatisation en marche! ⚙️"
    ],
    copy_profit: [
      "Excellent résultat! 🎉",
      "Copy trade rentable! 💎",
      "Le fournisseur a livré! 🏆",
      "Profit automatisé! 💵",
      "Stratégie gagnante! 🌟"
    ],
    report_profit: [
      "Aujourd'hui tu ne vas pas dormir en comptant les moutons... Tu vas dormir en comptant l'argent avec {value} de profit! 💰😁",
      "Continue comme ça et tu achèteras bientôt une Ferrari! 🏎️💨",
      "Semaine verte! {value} de profit. Tu voles! 🚀",
      "Aujourd'hui tu as bien fait... Très bien! {value} de profit! 👏😎"
    ],
    report_loss: [
      "Tu es très bon... À perdre de l'argent. Aujourd'hui tu as perdu {value}. 😔",
      "Fin de journée avec {value} de perte... Je suis déçu, mais demain on récupère. 😞",
      "Aujourd'hui n'était pas ton jour... {value} de perte. Mais calme-toi, demain est un autre jour! 💪"
    ],
    sale: [
      "Vente approuvée! 1M ARRIVE BIENTÔT! 🚀🎯",
      "Vente approuvée! Plus d'argent dans ta poche! 💰",
      "Vente confirmée! Vendons plus! 🔥"
    ],
    renewal: [
      "Renouvellement confirmé! {value} de plus dans ta poche! 💵",
      "Le client a renouvelé! La fidélité c'est tout! 🤝",
      "Renouvellement approuvé! Continue comme ça! ✅"
    ]
  },

  "de-DE": {
    profit: [
      "Glückwunsch zum Gewinn! 🎉",
      "Hervorragende Ausführung! 🏆",
      "Beständigkeit ist der Schlüssel! 💎",
      "Noch ein Grün! 🟢",
      "Gewinn gesichert! 💵"
    ],
    loss: [
      "Teil des Spiels! 💪",
      "Der nächste Trade wird besser! 🎯",
      "Stop Loss ist Schutz! 🛡️",
      "Kopf hoch! 🔥",
      "Verluste sind Teil des Erfolgs! 📈"
    ],
    open: [
      "Disziplin immer! 💪",
      "Fokus und Geduld! 🎯",
      "Folge deinem Plan! 📋",
      "Vertraue dem Prozess! ⚡",
      "Risikomanagement zuerst! 🛡️"
    ],
    copy_open: [
      "Trade erfolgreich kopiert! ✅",
      "Den Besten folgen! 🌟",
      "Copy Trade aktiviert! 🚀",
      "Vertrauen in den Anbieter! 👑",
      "Automatisierung läuft! ⚙️"
    ],
    copy_profit: [
      "Hervorragendes Ergebnis! 🎉",
      "Profitabler Copy Trade! 💎",
      "Anbieter hat geliefert! 🏆",
      "Automatisierter Gewinn! 💵",
      "Gewinnstrategie! 🌟"
    ],
    report_profit: [
      "Heute wirst du nicht Schafe zählen... Du wirst Geld zählen mit {value} Gewinn! 💰😁",
      "Mach weiter so und du kaufst bald einen Ferrari! 🏎️💨",
      "Grüne Woche! {value} Gewinn. Du fliegst! 🚀",
      "Heute hast du gut gemacht... Sehr gut! {value} Gewinn! 👏😎"
    ],
    report_loss: [
      "Du bist sehr gut... Im Geld verlieren. Heute hast du {value} verloren. 😔",
      "Tag endet mit {value} Verlust... Ich bin enttäuscht, aber morgen erholen wir uns. 😞",
      "Heute war nicht dein Tag... {value} Verlust. Aber ruhig, morgen ist ein anderer Tag! 💪"
    ],
    sale: [
      "Verkauf genehmigt! 1M KOMMT BALD! 🚀🎯",
      "Verkauf genehmigt! Mehr Geld in deiner Tasche! 💰",
      "Verkauf bestätigt! Lass uns mehr verkaufen! 🔥"
    ],
    renewal: [
      "Verlängerung bestätigt! {value} mehr in deiner Tasche! 💵",
      "Kunde hat verlängert! Loyalität ist alles! 🤝",
      "Verlängerung genehmigt! Mach weiter so! ✅"
    ]
  },

  "it-IT": {
    profit: [
      "Congratulazioni per il guadagno! 🎉",
      "Esecuzione eccellente! 🏆",
      "La coerenza è la chiave! 💎",
      "Un altro verde! 🟢",
      "Profitto assicurato! 💵"
    ],
    loss: [
      "Fa parte del gioco! 💪",
      "Il prossimo trade sarà migliore! 🎯",
      "Lo stop loss è protezione! 🛡️",
      "Tieni la testa alta! 🔥",
      "Le perdite fanno parte del successo! 📈"
    ],
    open: [
      "Disciplina sempre! 💪",
      "Concentrazione e pazienza! 🎯",
      "Segui il tuo piano! 📋",
      "Fidati del processo! ⚡",
      "Gestione del rischio prima di tutto! 🛡️"
    ],
    copy_open: [
      "Trade copiato con successo! ✅",
      "Seguendo i migliori! 🌟",
      "Copy trade attivato! 🚀",
      "Fiducia nel provider! 👑",
      "Automazione funzionante! ⚙️"
    ],
    copy_profit: [
      "Risultato eccellente! 🎉",
      "Copy trade redditizio! 💎",
      "Il provider ha consegnato! 🏆",
      "Profitto automatizzato! 💵",
      "Strategia vincente! 🌟"
    ],
    report_profit: [
      "Oggi non dormirai contando le pecore... Dormirai contando i soldi con {value} di profitto! 💰😁",
      "Continua così e presto comprerai una Ferrari! 🏎️💨",
      "Settimana verde! {value} di profitto. Stai volando! 🚀",
      "Oggi hai fatto bene... Molto bene! {value} di profitto! 👏😎"
    ],
    report_loss: [
      "Sei molto bravo... A perdere soldi. Oggi hai perso {value}. 😔",
      "Finendo la giornata con {value} di perdita... Sono deluso, ma domani recuperiamo. 😞",
      "Oggi non era il tuo giorno... {value} di perdita. Ma calma, domani è un altro giorno! 💪"
    ],
    sale: [
      "Vendita approvata! 1M STA ARRIVANDO! 🚀🎯",
      "Vendita approvata! Più soldi in tasca! 💰",
      "Vendita confermata! Vendiamo di più! 🔥"
    ],
    renewal: [
      "Rinnovo confermato! {value} in più in tasca! 💵",
      "Il cliente ha rinnovato! La fedeltà è tutto! 🤝",
      "Rinnovo approvato! Continua così! ✅"
    ]
  },

  "ru-RU": {
    profit: [
      "Поздравляем с прибылью! 🎉",
      "Отличное исполнение! 🏆",
      "Последовательность - ключ! 💎",
      "Еще один зеленый! 🟢",
      "Прибыль обеспечена! 💵"
    ],
    loss: [
      "Часть игры! 💪",
      "Следующая сделка будет лучше! 🎯",
      "Стоп-лосс - это защита! 🛡️",
      "Держи голову выше! 🔥",
      "Потери - часть успеха! 📈"
    ],
    open: [
      "Дисциплина всегда! 💪",
      "Фокус и терпение! 🎯",
      "Следуй своему плану! 📋",
      "Доверяй процессу! ⚡",
      "Управление рисками прежде всего! 🛡️"
    ],
    copy_open: [
      "Сделка успешно скопирована! ✅",
      "Следуем за лучшими! 🌟",
      "Копи-трейдинг активирован! 🚀",
      "Доверие к провайдеру! 👑",
      "Автоматизация работает! ⚙️"
    ],
    copy_profit: [
      "Отличный результат! 🎉",
      "Прибыльный копи-трейдинг! 💎",
      "Провайдер выполнил! 🏆",
      "Автоматизированная прибыль! 💵",
      "Выигрышная стратегия! 🌟"
    ],
    report_profit: [
      "Сегодня ты не будешь считать овец... Ты будешь считать деньги с {value} прибыли! 💰😁",
      "Продолжай в том же духе и скоро купишь Ferrari! 🏎️💨",
      "Зеленая неделя! {value} прибыли. Ты летишь! 🚀",
      "Сегодня ты хорошо поработал... Очень хорошо! {value} прибыли! 👏😎"
    ],
    report_loss: [
      "Ты очень хорош... В потере денег. Сегодня ты потерял {value}. 😔",
      "Заканчиваем день с {value} убытка... Я разочарован, но завтра восстановимся. 😞",
      "Сегодня не твой день... {value} убытка. Но спокойно, завтра другой день! 💪"
    ],
    sale: [
      "Продажа одобрена! 1М УЖЕ БЛИЗКО! 🚀🎯",
      "Продажа одобрена! Больше денег в кармане! 💰",
      "Продажа подтверждена! Давай продавать больше! 🔥"
    ],
    renewal: [
      "Продление подтверждено! {value} больше в кармане! 💵",
      "Клиент продлил! Лояльность - это все! 🤝",
      "Продление одобрено! Продолжай в том же духе! ✅"
    ]
  },

  "ja-JP": {
    profit: [
      "利益おめでとうございます！🎉",
      "素晴らしい実行！🏆",
      "一貫性が鍵！💎",
      "もう一つのグリーン！🟢",
      "利益確保！💵"
    ],
    loss: [
      "ゲームの一部！💪",
      "次のトレードはもっと良くなる！🎯",
      "ストップロスは保護！🛡️",
      "頭を上げて！🔥",
      "損失は成功の一部！📈"
    ],
    open: [
      "常に規律！💪",
      "集中と忍耐！🎯",
      "計画に従う！📋",
      "プロセスを信頼！⚡",
      "リスク管理が最優先！🛡️"
    ],
    copy_open: [
      "トレードが正常にコピーされました！✅",
      "最高のものに従う！🌟",
      "コピートレード有効化！🚀",
      "プロバイダーを信頼！👑",
      "自動化が機能中！⚙️"
    ],
    copy_profit: [
      "素晴らしい結果！🎉",
      "収益性の高いコピートレード！💎",
      "プロバイダーが提供！🏆",
      "自動化された利益！💵",
      "勝利戦略！🌟"
    ],
    report_profit: [
      "今日は羊を数えて眠らない...{value}の利益でお金を数えて眠る！💰😁",
      "このまま続ければすぐにフェラーリを買える！🏎️💨",
      "グリーンウィーク！{value}の利益。飛んでいる！🚀",
      "今日はよくやった...とてもよくやった！{value}の利益！👏😎"
    ],
    report_loss: [
      "あなたはとても上手...お金を失うのが。今日は{value}を失った。😔",
      "{value}の損失で一日を終える...失望したが、明日は回復する。😞",
      "今日はあなたの日ではなかった...{value}の損失。でも落ち着いて、明日は別の日！💪"
    ],
    sale: [
      "販売承認！1Mはもうすぐ！🚀🎯",
      "販売承認！ポケットにもっとお金！💰",
      "販売確認！もっと売ろう！🔥"
    ],
    renewal: [
      "更新確認！ポケットに{value}追加！💵",
      "クライアントが更新！忠誠心がすべて！🤝",
      "更新承認！このまま続けて！✅"
    ]
  },

  "zh-CN": {
    profit: [
      "恭喜获利！🎉",
      "出色的执行！🏆",
      "一致性是关键！💎",
      "又一个绿色！🟢",
      "利润已确保！💵"
    ],
    loss: [
      "游戏的一部分！💪",
      "下一笔交易会更好！🎯",
      "止损是保护！🛡️",
      "抬起头来！🔥",
      "损失是成功的一部分！📈"
    ],
    open: [
      "始终保持纪律！💪",
      "专注和耐心！🎯",
      "遵循你的计划！📋",
      "相信过程！⚡",
      "风险管理优先！🛡️"
    ],
    copy_open: [
      "交易复制成功！✅",
      "跟随最好的！🌟",
      "跟单交易已激活！🚀",
      "信任提供商！👑",
      "自动化运行中！⚙️"
    ],
    copy_profit: [
      "出色的结果！🎉",
      "盈利的跟单交易！💎",
      "提供商兑现！🏆",
      "自动化利润！💵",
      "获胜策略！🌟"
    ],
    report_profit: [
      "今天你不会数羊入睡...你会数着{value}的利润入睡！💰😁",
      "继续保持，你很快就能买法拉利！🏎️💨",
      "绿色周！{value}利润。你在飞！🚀",
      "今天你做得很好...非常好！{value}利润！👏😎"
    ],
    report_loss: [
      "你很擅长...亏钱。今天你亏了{value}。😔",
      "以{value}的亏损结束一天...我很失望，但明天我们会恢复。😞",
      "今天不是你的日子...{value}亏损。但冷静，明天又是新的一天！💪"
    ],
    sale: [
      "销售已批准！1M即将到来！🚀🎯",
      "销售已批准！口袋里更多钱！💰",
      "销售已确认！让我们卖更多！🔥"
    ],
    renewal: [
      "续费已确认！口袋里多了{value}！💵",
      "客户续费了！忠诚就是一切！🤝",
      "续费已批准！继续保持！✅"
    ]
  },

  "ko-KR": {
    profit: [
      "이익 축하합니다! 🎉",
      "훌륭한 실행! 🏆",
      "일관성이 핵심! 💎",
      "또 다른 그린! 🟢",
      "이익 확보! 💵"
    ],
    loss: [
      "게임의 일부! 💪",
      "다음 거래는 더 나을 것입니다! 🎯",
      "손절매는 보호! 🛡️",
      "고개를 들어! 🔥",
      "손실은 성공의 일부! 📈"
    ],
    open: [
      "항상 규율! 💪",
      "집중과 인내! 🎯",
      "계획을 따르세요! 📋",
      "프로세스를 신뢰! ⚡",
      "위험 관리 우선! 🛡️"
    ],
    copy_open: [
      "거래가 성공적으로 복사되었습니다! ✅",
      "최고를 따라가기! 🌟",
      "카피 트레이딩 활성화! 🚀",
      "공급자를 신뢰! 👑",
      "자동화 작동 중! ⚙️"
    ],
    copy_profit: [
      "훌륭한 결과! 🎉",
      "수익성 있는 카피 트레이딩! 💎",
      "공급자가 제공했습니다! 🏆",
      "자동화된 이익! 💵",
      "승리 전략! 🌟"
    ],
    report_profit: [
      "오늘 당신은 양을 세며 잠들지 않을 것입니다... {value}의 이익으로 돈을 세며 잠들 것입니다! 💰😁",
      "계속 이렇게 하면 곧 페라리를 살 수 있습니다! 🏎️💨",
      "그린 주! {value} 이익. 당신은 날고 있습니다! 🚀",
      "오늘 잘했습니다... 아주 잘했습니다! {value} 이익! 👏😎"
    ],
    report_loss: [
      "당신은 매우 능숙합니다... 돈을 잃는 데. 오늘 {value}를 잃었습니다. 😔",
      "{value}의 손실로 하루를 마칩니다... 실망했지만 내일은 회복할 것입니다. 😞",
      "오늘은 당신의 날이 아니었습니다... {value} 손실. 하지만 진정하세요, 내일은 또 다른 날입니다! 💪"
    ],
    sale: [
      "판매 승인! 1M이 곧 옵니다! 🚀🎯",
      "판매 승인! 주머니에 더 많은 돈! 💰",
      "판매 확인! 더 많이 팔자! 🔥"
    ],
    renewal: [
      "갱신 확인! 주머니에 {value} 추가! 💵",
      "고객이 갱신했습니다! 충성도가 전부입니다! 🤝",
      "갱신 승인! 계속 유지하세요! ✅"
    ]
  },

  "hi-IN": {
    profit: [
      "लाभ के लिए बधाई! 🎉",
      "उत्कृष्ट निष्पादन! 🏆",
      "निरंतरता कुंजी है! 💎",
      "एक और हरा! 🟢",
      "लाभ सुरक्षित! 💵"
    ],
    loss: [
      "खेल का हिस्सा! 💪",
      "अगला व्यापार बेहतर होगा! 🎯",
      "स्टॉप लॉस सुरक्षा है! 🛡️",
      "सिर ऊंचा रखें! 🔥",
      "नुकसान सफलता का हिस्सा हैं! 📈"
    ],
    open: [
      "हमेशा अनुशासन! 💪",
      "ध्यान और धैर्य! 🎯",
      "अपनी योजना का पालन करें! 📋",
      "प्रक्रिया पर भरोसा करें! ⚡",
      "जोखिम प्रबंधन पहले! 🛡️"
    ],
    copy_open: [
      "व्यापार सफलतापूर्वक कॉपी किया गया! ✅",
      "सर्वश्रेष्ठ का अनुसरण! 🌟",
      "कॉपी ट्रेड सक्रिय! 🚀",
      "प्रदाता पर भरोसा! 👑",
      "स्वचालन काम कर रहा है! ⚙️"
    ],
    copy_profit: [
      "उत्कृष्ट परिणाम! 🎉",
      "लाभदायक कॉपी ट्रेड! 💎",
      "प्रदाता ने दिया! 🏆",
      "स्वचालित लाभ! 💵",
      "जीतने की रणनीति! 🌟"
    ],
    report_profit: [
      "आज आप भेड़ गिनकर नहीं सोएंगे... आप {value} के लाभ के साथ पैसे गिनकर सोएंगे! 💰😁",
      "ऐसे ही जारी रखें और जल्द ही फेरारी खरीदेंगे! 🏎️💨",
      "हरा सप्ताह! {value} का लाभ। आप उड़ रहे हैं! 🚀",
      "आज आपने अच्छा किया... बहुत अच्छा! {value} का लाभ! 👏😎"
    ],
    report_loss: [
      "आप बहुत अच्छे हैं... पैसे खोने में। आज आपने {value} खोया। 😔",
      "{value} के नुकसान के साथ दिन समाप्त... मैं निराश हूं, लेकिन कल हम ठीक हो जाएंगे। 😞",
      "आज आपका दिन नहीं था... {value} का नुकसान। लेकिन शांत रहें, कल एक और दिन है! 💪"
    ],
    sale: [
      "बिक्री स्वीकृत! 1M जल्द आ रहा है! 🚀🎯",
      "बिक्री स्वीकृत! जेब में अधिक पैसा! 💰",
      "बिक्री पुष्टि! और बेचें! 🔥"
    ],
    renewal: [
      "नवीनीकरण पुष्टि! जेब में {value} अधिक! 💵",
      "ग्राहक ने नवीनीकरण किया! वफादारी सब कुछ है! 🤝",
      "नवीनीकरण स्वीकृत! ऐसे ही जारी रखें! ✅"
    ]
  },

  "ar-SA": {
    profit: [
      "تهانينا على الربح! 🎉",
      "تنفيذ ممتاز! 🏆",
      "الاتساق هو المفتاح! 💎",
      "أخضر آخر! 🟢",
      "الربح مضمون! 💵"
    ],
    loss: [
      "جزء من اللعبة! 💪",
      "الصفقة التالية ستكون أفضل! 🎯",
      "وقف الخسارة هو الحماية! 🛡️",
      "ارفع رأسك! 🔥",
      "الخسائر جزء من النجاح! 📈"
    ],
    open: [
      "الانضباط دائماً! 💪",
      "التركيز والصبر! 🎯",
      "اتبع خطتك! 📋",
      "ثق بالعملية! ⚡",
      "إدارة المخاطر أولاً! 🛡️"
    ],
    copy_open: [
      "تم نسخ الصفقة بنجاح! ✅",
      "متابعة الأفضل! 🌟",
      "تم تفعيل النسخ التلقائي! 🚀",
      "الثقة في المزود! 👑",
      "الأتمتة تعمل! ⚙️"
    ],
    copy_profit: [
      "نتيجة ممتازة! 🎉",
      "نسخ تداول مربح! 💎",
      "المزود قدم! 🏆",
      "ربح تلقائي! 💵",
      "استراتيجية فائزة! 🌟"
    ],
    report_profit: [
      "اليوم لن تنام تعد الخراف... ستنام تعد المال مع {value} من الربح! 💰😁",
      "استمر هكذا وستشتري فيراري قريباً! 🏎️💨",
      "أسبوع أخضر! {value} من الربح. أنت تطير! 🚀",
      "اليوم قمت بعمل جيد... جيد جداً! {value} من الربح! 👏😎"
    ],
    report_loss: [
      "أنت جيد جداً... في خسارة المال. اليوم خسرت {value}. 😔",
      "إنهاء اليوم بخسارة {value}... أنا محبط، لكن غداً سنتعافى. 😞",
      "اليوم لم يكن يومك... {value} خسارة. لكن هدئ، غداً يوم آخر! 💪"
    ],
    sale: [
      "تمت الموافقة على البيع! 1M قريب! 🚀🎯",
      "تمت الموافقة على البيع! المزيد من المال في جيبك! 💰",
      "تم تأكيد البيع! لنبيع المزيد! 🔥"
    ],
    renewal: [
      "تم تأكيد التجديد! {value} أكثر في جيبك! 💵",
      "العميل جدد! الولاء هو كل شيء! 🤝",
      "تمت الموافقة على التجديد! استمر هكذا! ✅"
    ]
  }
};

/**
 * Retorna uma frase aleatória do tipo especificado
 */
export function getRandomPhrase(type: PhraseType, language: string = 'pt-BR', value?: string): string {
  // Idiomas suportados
  const supportedLanguages = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ru-RU', 'ja-JP', 'zh-CN', 'ko-KR', 'hi-IN', 'ar-SA'];
  
  // Se o idioma não for suportado, usa pt-BR como padrão
  const lang = supportedLanguages.includes(language) ? language : 'pt-BR';
  
  const phrasesArray = motivationalPhrases[lang][type];
  let phrase = phrasesArray[Math.floor(Math.random() * phrasesArray.length)];
  
  // Substituir {value} se fornecido
  if (value) {
    phrase = phrase.replace('{value}', value);
  }
  
  return phrase;
}
