/**
 * Frases motivacionais para notificações de trading
 * Suporta 12 idiomas
 */

// ============================================
// PORTUGUÊS (pt-BR)
// ============================================
const PROFIT_PHRASES_PT = [
  "Opa! {profit} caiu na conta! Chama no churrasco!",
  "Eita! {profit} de lucro! Hoje o almoco e por minha conta!",
  "Bora! {profit} no bolso! Quem disse que trader nao ganha dinheiro?",
  "Aeee! {profit} garantidos! Hoje eu sou Buffett!",
  "Olha so! {profit} de profit! Ta ficando bom isso aqui!",
  "Uhuul! {profit} no green! Bora comprar aquele carro... de brinquedo!",
  "Eba! {profit} de lucro! Hoje eu sou o lobo de Wall Street... da quebrada!",
  "Massa! {profit} conquistados! Ja posso me aposentar... daqui 30 anos!",
  "Show! {profit} de profit! Quem precisa de emprego mesmo?",
  "Boa! {profit} no dia! Hoje eu pago o cafezinho!",
];

const LOSS_PHRASES_PT = [
  "Voce e muito bom... Em perder dinheiro. Hoje voce perdeu {loss}.",
  "Finalizando o dia com prejuizo de {loss}. Fiquei decepcionado, mas amanha recuperamos.",
  "Eita... {loss} de loss hoje. Bora estudar mais!",
  "Vermelho hoje: {loss}. Amanha a gente vira esse jogo!",
  "Loss de {loss}. Calma, faz parte do processo!",
  "Hoje nao foi... {loss} no vermelho. Bora revisar os trades!",
  "Red no dia: {loss}. Amanha e outro dia!",
];

const NEUTRAL_PHRASES_PT = [
  "Mais um dia de trades! Vamos com tudo!",
  "Foco e disciplina! O lucro vem!",
  "Trader de verdade nao desiste!",
  "Hoje e dia de fazer historia!",
];

const TRADE_OPENED_PHRASES_PT = [
  "Trade aberto! Vamos la!",
  "Posicao aberta! Foco no gerenciamento!",
  "Entrada executada! Agora e aguardar!",
  "Trade ativo! Bora lucrar!",
  "Posicao iniciada! Disciplina sempre!",
];

const TRADE_TP_PHRASES_PT = [
  "BOOOOM! Take Profit bateu! {profit}",
  "Green! TP atingido! {profit} no bolso!",
  "Acertou! Take Profit! {profit}",
  "Mandou bem! TP fechado com {profit}!",
  "Profit! {profit} garantido!",
];

const TRADE_SL_PHRASES_PT = [
  "Stop Loss acionado. Loss: {loss}",
  "SL bateu. Prejuizo: {loss}. Bora recuperar!",
  "Stop acionado: {loss}. Faz parte!",
  "Loss de {loss}. Proxima sera melhor!",
  "SL executado: {loss}. Mantenha a disciplina!",
];

// ============================================
// INGLÊS (en-US)
// ============================================
const PROFIT_PHRASES_EN = [
  "Boom! {profit} in the bank! Call the squad!",
  "Nice! {profit} profit! Lunch is on me today!",
  "Let's go! {profit} in the pocket! Who said traders don't make money?",
  "Yeah! {profit} secured! Today I'm Buffett!",
  "Look at that! {profit} profit! This is getting good!",
  "Woohoo! {profit} in the green! Time to buy that car... toy car!",
  "Sweet! {profit} profit! Today I'm the Wolf of Wall Street... from the hood!",
  "Awesome! {profit} earned! I can retire now... in 30 years!",
  "Nice! {profit} profit! Who needs a job anyway?",
  "Good! {profit} today! Coffee's on me!",
];

const LOSS_PHRASES_EN = [
  "You're really good... At losing money. Today you lost {loss}.",
  "Closing the day with {loss} loss. Disappointed, but we'll recover tomorrow.",
  "Ouch... {loss} loss today. Let's study more!",
  "Red today: {loss}. Tomorrow we turn this around!",
  "Loss of {loss}. Calm down, it's part of the process!",
  "Not today... {loss} in the red. Let's review those trades!",
  "Red day: {loss}. Tomorrow is another day!",
];

const NEUTRAL_PHRASES_EN = [
  "Another day of trading! Let's go all in!",
  "Focus and discipline! Profit will come!",
  "Real traders never quit!",
  "Today is the day to make history!",
];

const TRADE_OPENED_PHRASES_EN = [
  "Trade opened! Let's go!",
  "Position opened! Focus on management!",
  "Entry executed! Now we wait!",
  "Trade active! Let's profit!",
  "Position started! Discipline always!",
];

const TRADE_TP_PHRASES_EN = [
  "BOOM! Take Profit hit! {profit}",
  "Green! TP reached! {profit} in the pocket!",
  "Got it! Take Profit! {profit}",
  "Well done! TP closed with {profit}!",
  "Profit! {profit} secured!",
];

const TRADE_SL_PHRASES_EN = [
  "Stop Loss triggered. Loss: {loss}",
  "SL hit. Loss: {loss}. Let's recover!",
  "Stop triggered: {loss}. It happens!",
  "Loss of {loss}. Next one will be better!",
  "SL executed: {loss}. Keep the discipline!",
];

// ============================================
// ESPANHOL (es-ES)
// ============================================
const PROFIT_PHRASES_ES = [
  "Ole! {profit} en la cuenta! Vamos de tapas!",
  "Que bien! {profit} de ganancia! Hoy invito yo!",
  "Vamos! {profit} en el bolsillo! Quien dijo que los traders no ganan dinero?",
  "Genial! {profit} asegurados! Hoy soy Buffett!",
  "Mira eso! {profit} de profit! Esto se esta poniendo bueno!",
  "Yupi! {profit} en verde! Vamos a comprar ese coche... de juguete!",
  "Fantastico! {profit} de ganancia! Hoy soy el lobo de Wall Street... del barrio!",
  "Increible! {profit} ganados! Ya puedo jubilarme... en 30 anos!",
  "Bien! {profit} de profit! Quien necesita trabajo?",
  "Bueno! {profit} hoy! Invito el cafe!",
];

const LOSS_PHRASES_ES = [
  "Eres muy bueno... Perdiendo dinero. Hoy perdiste {loss}.",
  "Cerrando el dia con perdida de {loss}. Decepcionado, pero manana recuperamos.",
  "Ay... {loss} de perdida hoy. Vamos a estudiar mas!",
  "Rojo hoy: {loss}. Manana cambiamos esto!",
  "Perdida de {loss}. Calma, es parte del proceso!",
  "Hoy no fue... {loss} en rojo. Vamos a revisar los trades!",
  "Dia rojo: {loss}. Manana es otro dia!",
];

const NEUTRAL_PHRASES_ES = [
  "Otro dia de trading! Vamos con todo!",
  "Foco y disciplina! La ganancia vendra!",
  "Los traders de verdad no se rinden!",
  "Hoy es dia de hacer historia!",
];

const TRADE_OPENED_PHRASES_ES = [
  "Trade abierto! Vamos!",
  "Posicion abierta! Foco en la gestion!",
  "Entrada ejecutada! Ahora a esperar!",
  "Trade activo! Vamos a ganar!",
  "Posicion iniciada! Disciplina siempre!",
];

const TRADE_TP_PHRASES_ES = [
  "BOOM! Take Profit alcanzado! {profit}",
  "Verde! TP logrado! {profit} en el bolsillo!",
  "Acertaste! Take Profit! {profit}",
  "Bien hecho! TP cerrado con {profit}!",
  "Profit! {profit} asegurado!",
];

const TRADE_SL_PHRASES_ES = [
  "Stop Loss activado. Perdida: {loss}",
  "SL alcanzado. Perdida: {loss}. Vamos a recuperar!",
  "Stop activado: {loss}. Pasa!",
  "Perdida de {loss}. La proxima sera mejor!",
  "SL ejecutado: {loss}. Mantener la disciplina!",
];

// ============================================
// FRANCÊS (fr-FR)
// ============================================
const PROFIT_PHRASES_FR = [
  "Oui! {profit} dans le compte! On fete ca!",
  "Super! {profit} de profit! Aujourd'hui c'est moi qui invite!",
  "Allez! {profit} dans la poche! Qui a dit que les traders ne gagnent pas d'argent?",
  "Genial! {profit} assures! Aujourd'hui je suis Buffett!",
  "Regardez ca! {profit} de profit! Ca devient bon!",
  "Youpi! {profit} en vert! On achete cette voiture... miniature!",
  "Excellent! {profit} de profit! Aujourd'hui je suis le loup de Wall Street... du quartier!",
  "Incroyable! {profit} gagnes! Je peux prendre ma retraite... dans 30 ans!",
  "Bien! {profit} de profit! Qui a besoin d'un emploi?",
  "Bon! {profit} aujourd'hui! Le cafe est pour moi!",
];

const LOSS_PHRASES_FR = [
  "Tu es tres bon... A perdre de l'argent. Aujourd'hui tu as perdu {loss}.",
  "Fin de journee avec {loss} de perte. Decu, mais on recupere demain.",
  "Aie... {loss} de perte aujourd'hui. Etudions plus!",
  "Rouge aujourd'hui: {loss}. Demain on change ca!",
  "Perte de {loss}. Calme, ca fait partie du processus!",
  "Pas aujourd'hui... {loss} en rouge. Revoyons ces trades!",
  "Jour rouge: {loss}. Demain est un autre jour!",
];

const NEUTRAL_PHRASES_FR = [
  "Un autre jour de trading! Allons-y a fond!",
  "Focus et discipline! Le profit viendra!",
  "Les vrais traders n'abandonnent jamais!",
  "Aujourd'hui on fait l'histoire!",
];

const TRADE_OPENED_PHRASES_FR = [
  "Trade ouvert! Allons-y!",
  "Position ouverte! Focus sur la gestion!",
  "Entree executee! Maintenant on attend!",
  "Trade actif! On va profiter!",
  "Position initiee! Discipline toujours!",
];

const TRADE_TP_PHRASES_FR = [
  "BOOM! Take Profit atteint! {profit}",
  "Vert! TP atteint! {profit} dans la poche!",
  "Reussi! Take Profit! {profit}",
  "Bien joue! TP ferme avec {profit}!",
  "Profit! {profit} assure!",
];

const TRADE_SL_PHRASES_FR = [
  "Stop Loss declenche. Perte: {loss}",
  "SL atteint. Perte: {loss}. On recupere!",
  "Stop declenche: {loss}. Ca arrive!",
  "Perte de {loss}. La prochaine sera meilleure!",
  "SL execute: {loss}. Gardez la discipline!",
];

// ============================================
// ALEMÃO (de-DE)
// ============================================
const PROFIT_PHRASES_DE = [
  "Toll! {profit} auf dem Konto! Lass uns feiern!",
  "Super! {profit} Gewinn! Heute lade ich ein!",
  "Los geht's! {profit} in der Tasche! Wer sagt, dass Trader kein Geld verdienen?",
  "Klasse! {profit} gesichert! Heute bin ich Buffett!",
  "Schau mal! {profit} Profit! Das wird gut!",
  "Juhu! {profit} im Grünen! Kaufen wir das Auto... Spielzeugauto!",
  "Fantastisch! {profit} Gewinn! Heute bin ich der Wolf der Wall Street... aus der Nachbarschaft!",
  "Unglaublich! {profit} verdient! Ich kann jetzt in Rente gehen... in 30 Jahren!",
  "Gut! {profit} Profit! Wer braucht schon einen Job?",
  "Schön! {profit} heute! Der Kaffee geht auf mich!",
];

const LOSS_PHRASES_DE = [
  "Du bist sehr gut... Im Geld verlieren. Heute hast du {loss} verloren.",
  "Tagesabschluss mit {loss} Verlust. Enttauscht, aber morgen erholen wir uns.",
  "Autsch... {loss} Verlust heute. Lass uns mehr lernen!",
  "Rot heute: {loss}. Morgen drehen wir das um!",
  "Verlust von {loss}. Ruhig, das gehört zum Prozess!",
  "Nicht heute... {loss} im Roten. Lass uns diese Trades überprüfen!",
  "Roter Tag: {loss}. Morgen ist ein neuer Tag!",
];

const NEUTRAL_PHRASES_DE = [
  "Ein weiterer Handelstag! Geben wir alles!",
  "Fokus und Disziplin! Der Gewinn kommt!",
  "Echte Trader geben nie auf!",
  "Heute machen wir Geschichte!",
];

const TRADE_OPENED_PHRASES_DE = [
  "Trade eroffnet! Los geht's!",
  "Position eroffnet! Fokus auf Management!",
  "Einstieg ausgefuhrt! Jetzt warten wir!",
  "Trade aktiv! Lass uns profitieren!",
  "Position gestartet! Disziplin immer!",
];

const TRADE_TP_PHRASES_DE = [
  "BOOM! Take Profit erreicht! {profit}",
  "Grun! TP erreicht! {profit} in der Tasche!",
  "Geschafft! Take Profit! {profit}",
  "Gut gemacht! TP geschlossen mit {profit}!",
  "Profit! {profit} gesichert!",
];

const TRADE_SL_PHRASES_DE = [
  "Stop Loss ausgelost. Verlust: {loss}",
  "SL erreicht. Verlust: {loss}. Wir erholen uns!",
  "Stop ausgelost: {loss}. Passiert!",
  "Verlust von {loss}. Der nachste wird besser!",
  "SL ausgefuhrt: {loss}. Disziplin bewahren!",
];

// ============================================
// ITALIANO (it-IT)
// ============================================
const PROFIT_PHRASES_IT = [
  "Evviva! {profit} sul conto! Festeggiamo!",
  "Fantastico! {profit} di profitto! Oggi offro io!",
  "Andiamo! {profit} in tasca! Chi ha detto che i trader non guadagnano?",
  "Grande! {profit} assicurati! Oggi sono Buffett!",
  "Guarda! {profit} di profit! Sta diventando bello!",
  "Evviva! {profit} in verde! Compriamo quella macchina... giocattolo!",
  "Eccellente! {profit} di profitto! Oggi sono il lupo di Wall Street... del quartiere!",
  "Incredibile! {profit} guadagnati! Posso andare in pensione... tra 30 anni!",
  "Bene! {profit} di profit! Chi ha bisogno di un lavoro?",
  "Buono! {profit} oggi! Il caffe lo offro io!",
];

const LOSS_PHRASES_IT = [
  "Sei molto bravo... A perdere soldi. Oggi hai perso {loss}.",
  "Chiusura giornata con {loss} di perdita. Deluso, ma domani recuperiamo.",
  "Ahi... {loss} di perdita oggi. Studiamo di piu!",
  "Rosso oggi: {loss}. Domani cambiamo!",
  "Perdita di {loss}. Calma, fa parte del processo!",
  "Non oggi... {loss} in rosso. Rivediamo questi trade!",
  "Giorno rosso: {loss}. Domani e un altro giorno!",
];

const NEUTRAL_PHRASES_IT = [
  "Un altro giorno di trading! Diamo tutto!",
  "Focus e disciplina! Il profitto arrivera!",
  "I veri trader non mollano mai!",
  "Oggi facciamo storia!",
];

const TRADE_OPENED_PHRASES_IT = [
  "Trade aperto! Andiamo!",
  "Posizione aperta! Focus sulla gestione!",
  "Entrata eseguita! Ora aspettiamo!",
  "Trade attivo! Profittiamo!",
  "Posizione iniziata! Disciplina sempre!",
];

const TRADE_TP_PHRASES_IT = [
  "BOOM! Take Profit raggiunto! {profit}",
  "Verde! TP raggiunto! {profit} in tasca!",
  "Fatto! Take Profit! {profit}",
  "Ben fatto! TP chiuso con {profit}!",
  "Profit! {profit} assicurato!",
];

const TRADE_SL_PHRASES_IT = [
  "Stop Loss attivato. Perdita: {loss}",
  "SL raggiunto. Perdita: {loss}. Recuperiamo!",
  "Stop attivato: {loss}. Succede!",
  "Perdita di {loss}. Il prossimo sara migliore!",
  "SL eseguito: {loss}. Mantieni la disciplina!",
];

// ============================================
// JAPONÊS (ja-JP)
// ============================================
const PROFIT_PHRASES_JA = [
  "やった！{profit}が入金！お祝いしよう！",
  "素晴らしい！{profit}の利益！今日は私のおごり！",
  "行こう！{profit}がポケットに！トレーダーは稼げないって誰が言った？",
  "最高！{profit}確保！今日は私がバフェット！",
  "見て！{profit}の利益！良くなってきた！",
  "わーい！{profit}黒字！その車を買おう...おもちゃの車！",
  "素晴らしい！{profit}の利益！今日は私がウォール街の狼...近所の！",
  "信じられない！{profit}獲得！もう引退できる...30年後に！",
  "いいね！{profit}の利益！仕事なんて誰が必要？",
  "良い！{profit}今日！コーヒーは私のおごり！",
];

const LOSS_PHRASES_JA = [
  "あなたは本当に上手...お金を失うのが。今日は{loss}失いました。",
  "{loss}の損失で一日を終える。がっかりだけど、明日取り戻そう。",
  "あら...今日は{loss}の損失。もっと勉強しよう！",
  "今日は赤字：{loss}。明日はこれを変えよう！",
  "{loss}の損失。落ち着いて、プロセスの一部だ！",
  "今日はダメだった...{loss}赤字。トレードを見直そう！",
  "赤字の日：{loss}。明日は別の日！",
];

const NEUTRAL_PHRASES_JA = [
  "また取引の日！全力で行こう！",
  "集中と規律！利益は来る！",
  "本物のトレーダーは諦めない！",
  "今日は歴史を作る日！",
];

const TRADE_OPENED_PHRASES_JA = [
  "トレード開始！行こう！",
  "ポジション開始！管理に集中！",
  "エントリー実行！今は待つ！",
  "トレードアクティブ！利益を出そう！",
  "ポジション開始！常に規律！",
];

const TRADE_TP_PHRASES_JA = [
  "ブーム！テイクプロフィット達成！{profit}",
  "黒字！TP達成！{profit}がポケットに！",
  "やった！テイクプロフィット！{profit}",
  "よくやった！TPクローズで{profit}！",
  "利益！{profit}確保！",
];

const TRADE_SL_PHRASES_JA = [
  "ストップロス発動。損失：{loss}",
  "SL達成。損失：{loss}。取り戻そう！",
  "ストップ発動：{loss}。起こるものだ！",
  "{loss}の損失。次はもっと良くなる！",
  "SL実行：{loss}。規律を保とう！",
];

// ============================================
// CHINÊS (zh-CN)
// ============================================
const PROFIT_PHRASES_ZH = [
  "太好了！{profit}到账！庆祝一下！",
  "太棒了！{profit}利润！今天我请客！",
  "走！{profit}进口袋！谁说交易员不赚钱？",
  "厉害！{profit}到手！今天我是巴菲特！",
  "看！{profit}利润！越来越好了！",
  "耶！{profit}盈利！买那辆车...玩具车！",
  "太好了！{profit}利润！今天我是华尔街之狼...街区的！",
  "不可思议！{profit}赚到！我可以退休了...30年后！",
  "好！{profit}利润！谁还需要工作？",
  "不错！{profit}今天！咖啡我请！",
];

const LOSS_PHRASES_ZH = [
  "你真厉害...亏钱。今天你亏了{loss}。",
  "今天以{loss}亏损结束。失望，但明天我们会恢复。",
  "哎呀...今天亏损{loss}。多学习吧！",
  "今天红了：{loss}。明天我们扭转！",
  "亏损{loss}。冷静，这是过程的一部分！",
  "今天不行...{loss}亏损。复盘这些交易！",
  "红色的一天：{loss}。明天又是新的一天！",
];

const NEUTRAL_PHRASES_ZH = [
  "又是交易的一天！全力以赴！",
  "专注和纪律！利润会来！",
  "真正的交易员永不放弃！",
  "今天是创造历史的日子！",
];

const TRADE_OPENED_PHRASES_ZH = [
  "交易开启！走！",
  "仓位开启！专注管理！",
  "入场执行！现在等待！",
  "交易活跃！赚钱吧！",
  "仓位启动！始终保持纪律！",
];

const TRADE_TP_PHRASES_ZH = [
  "爆！止盈达成！{profit}",
  "绿了！TP达成！{profit}进口袋！",
  "成功！止盈！{profit}",
  "干得好！TP平仓{profit}！",
  "利润！{profit}到手！",
];

const TRADE_SL_PHRASES_ZH = [
  "止损触发。亏损：{loss}",
  "SL达成。亏损：{loss}。恢复吧！",
  "止损触发：{loss}。会发生的！",
  "亏损{loss}。下次会更好！",
  "SL执行：{loss}。保持纪律！",
];

// ============================================
// COREANO (ko-KR)
// ============================================
const PROFIT_PHRASES_KO = [
  "좋아! {profit} 입금! 축하하자!",
  "대단해! {profit} 수익! 오늘은 내가 쏜다!",
  "가자! {profit} 주머니에! 트레이더가 돈 못 번다고 누가 그래?",
  "최고! {profit} 확보! 오늘 나는 버핏!",
  "봐! {profit} 수익! 점점 좋아지네!",
  "야호! {profit} 흑자! 그 차 사자... 장난감 차!",
  "환상적! {profit} 수익! 오늘 나는 월스트리트의 늑대... 동네의!",
  "믿을 수 없어! {profit} 벌었다! 이제 은퇴할 수 있어... 30년 후에!",
  "좋아! {profit} 수익! 누가 직장이 필요해?",
  "좋네! {profit} 오늘! 커피는 내가 산다!",
];

const LOSS_PHRASES_KO = [
  "당신은 정말 잘해... 돈 잃는 것을. 오늘 {loss} 잃었어.",
  "{loss} 손실로 하루를 마감. 실망했지만 내일 회복하자.",
  "아야... 오늘 {loss} 손실. 더 공부하자!",
  "오늘 적자: {loss}. 내일 바꾸자!",
  "{loss} 손실. 진정해, 과정의 일부야!",
  "오늘은 아니야... {loss} 적자. 거래를 검토하자!",
  "적자 날: {loss}. 내일은 다른 날!",
];

const NEUTRAL_PHRASES_KO = [
  "또 거래의 날! 전력으로 가자!",
  "집중과 규율! 수익이 올 거야!",
  "진짜 트레이더는 포기하지 않아!",
  "오늘은 역사를 만드는 날!",
];

const TRADE_OPENED_PHRASES_KO = [
  "거래 시작! 가자!",
  "포지션 시작! 관리에 집중!",
  "진입 실행! 이제 기다려!",
  "거래 활성! 수익 내자!",
  "포지션 시작! 항상 규율!",
];

const TRADE_TP_PHRASES_KO = [
  "붐! 익절 달성! {profit}",
  "흑자! TP 달성! {profit} 주머니에!",
  "성공! 익절! {profit}",
  "잘했어! TP 마감 {profit}!",
  "수익! {profit} 확보!",
];

const TRADE_SL_PHRASES_KO = [
  "손절 발동. 손실: {loss}",
  "SL 달성. 손실: {loss}. 회복하자!",
  "손절 발동: {loss}. 일어나는 일이야!",
  "{loss} 손실. 다음은 더 나을 거야!",
  "SL 실행: {loss}. 규율 유지!",
];

// ============================================
// RUSSO (ru-RU)
// ============================================
const PROFIT_PHRASES_RU = [
  "Ура! {profit} на счете! Отпразднуем!",
  "Отлично! {profit} прибыли! Сегодня я угощаю!",
  "Поехали! {profit} в кармане! Кто сказал, что трейдеры не зарабатывают?",
  "Класс! {profit} обеспечено! Сегодня я Баффет!",
  "Смотри! {profit} прибыли! Становится хорошо!",
  "Ура! {profit} в плюсе! Купим ту машину... игрушечную!",
  "Отлично! {profit} прибыли! Сегодня я волк с Уолл-стрит... из района!",
  "Невероятно! {profit} заработано! Могу уйти на пенсию... через 30 лет!",
  "Хорошо! {profit} прибыли! Кому нужна работа?",
  "Хорошо! {profit} сегодня! Кофе за мой счет!",
];

const LOSS_PHRASES_RU = [
  "Ты очень хорош... В потере денег. Сегодня ты потерял {loss}.",
  "Закрытие дня с {loss} убытка. Разочарован, но завтра восстановимся.",
  "Ой... {loss} убытка сегодня. Давай больше учиться!",
  "Красный сегодня: {loss}. Завтра изменим это!",
  "Убыток {loss}. Спокойно, это часть процесса!",
  "Не сегодня... {loss} в минусе. Пересмотрим эти сделки!",
  "Красный день: {loss}. Завтра другой день!",
];

const NEUTRAL_PHRASES_RU = [
  "Еще один день торговли! Вперед на всю!",
  "Фокус и дисциплина! Прибыль придет!",
  "Настоящие трейдеры никогда не сдаются!",
  "Сегодня день для истории!",
];

const TRADE_OPENED_PHRASES_RU = [
  "Сделка открыта! Поехали!",
  "Позиция открыта! Фокус на управлении!",
  "Вход выполнен! Теперь ждем!",
  "Сделка активна! Будем зарабатывать!",
  "Позиция начата! Дисциплина всегда!",
];

const TRADE_TP_PHRASES_RU = [
  "БУМ! Тейк-профит достигнут! {profit}",
  "Зеленый! TP достигнут! {profit} в кармане!",
  "Получилось! Тейк-профит! {profit}",
  "Молодец! TP закрыт с {profit}!",
  "Прибыль! {profit} обеспечено!",
];

const TRADE_SL_PHRASES_RU = [
  "Стоп-лосс сработал. Убыток: {loss}",
  "SL достигнут. Убыток: {loss}. Восстановимся!",
  "Стоп сработал: {loss}. Бывает!",
  "Убыток {loss}. Следующий будет лучше!",
  "SL выполнен: {loss}. Сохраняй дисциплину!",
];

// ============================================
// ÁRABE (ar-SA)
// ============================================
const PROFIT_PHRASES_AR = [
  "رائع! {profit} في الحساب! لنحتفل!",
  "ممتاز! {profit} ربح! اليوم أنا أدفع!",
  "هيا! {profit} في الجيب! من قال أن المتداولين لا يكسبون المال؟",
  "عظيم! {profit} مضمون! اليوم أنا بافيت!",
  "انظر! {profit} ربح! أصبح جيدًا!",
  "يا! {profit} في الأخضر! لنشتري تلك السيارة... اللعبة!",
  "ممتاز! {profit} ربح! اليوم أنا ذئب وول ستريت... من الحي!",
  "لا يصدق! {profit} مكتسب! يمكنني التقاعد الآن... بعد 30 عامًا!",
  "جيد! {profit} ربح! من يحتاج وظيفة؟",
  "جيد! {profit} اليوم! القهوة علي!",
];

const LOSS_PHRASES_AR = [
  "أنت جيد جدًا... في خسارة المال. اليوم خسرت {loss}.",
  "إغلاق اليوم بخسارة {loss}. خائب الأمل، لكن سنتعافى غدًا.",
  "أوه... {loss} خسارة اليوم. لندرس أكثر!",
  "أحمر اليوم: {loss}. غدًا سنغير هذا!",
  "خسارة {loss}. هدوء، إنها جزء من العملية!",
  "ليس اليوم... {loss} في الأحمر. لنراجع هذه الصفقات!",
  "يوم أحمر: {loss}. غدًا يوم آخر!",
];

const NEUTRAL_PHRASES_AR = [
  "يوم آخر من التداول! لنذهب بكل شيء!",
  "التركيز والانضباط! الربح سيأتي!",
  "المتداولون الحقيقيون لا يستسلمون أبدًا!",
  "اليوم هو يوم صنع التاريخ!",
];

const TRADE_OPENED_PHRASES_AR = [
  "صفقة مفتوحة! هيا!",
  "مركز مفتوح! التركيز على الإدارة!",
  "الدخول منفذ! الآن ننتظر!",
  "صفقة نشطة! لنربح!",
  "مركز بدأ! الانضباط دائمًا!",
];

const TRADE_TP_PHRASES_AR = [
  "بوم! جني الأرباح تحقق! {profit}",
  "أخضر! TP تحقق! {profit} في الجيب!",
  "نجح! جني الأرباح! {profit}",
  "أحسنت! TP مغلق مع {profit}!",
  "ربح! {profit} مضمون!",
];

const TRADE_SL_PHRASES_AR = [
  "وقف الخسارة مفعل. خسارة: {loss}",
  "SL تحقق. خسارة: {loss}. سنتعافى!",
  "وقف مفعل: {loss}. يحدث!",
  "خسارة {loss}. التالي سيكون أفضل!",
  "SL منفذ: {loss}. حافظ على الانضباط!",
];

// ============================================
// HINDI (hi-IN)
// ============================================
const PROFIT_PHRASES_HI = [
  "वाह! {profit} खाते में! जश्न मनाएं!",
  "बढ़िया! {profit} लाभ! आज मैं treat दूंगा!",
  "चलो! {profit} जेब में! किसने कहा traders पैसे नहीं कमाते?",
  "शानदार! {profit} सुरक्षित! आज मैं Buffett हूं!",
  "देखो! {profit} profit! अच्छा हो रहा है!",
  "वाह! {profit} हरे में! वह कार खरीदें... खिलौना कार!",
  "उत्कृष्ट! {profit} लाभ! आज मैं Wall Street का भेड़िया हूं... मोहल्ले का!",
  "अविश्वसनीय! {profit} कमाया! अब retire हो सकता हूं... 30 साल में!",
  "अच्छा! {profit} profit! नौकरी किसे चाहिए?",
  "बढ़िया! {profit} आज! कॉफी मेरी तरफ से!",
];

const LOSS_PHRASES_HI = [
  "आप बहुत अच्छे हैं... पैसे खोने में। आज आपने {loss} खोया।",
  "{loss} नुकसान के साथ दिन समाप्त। निराश, लेकिन कल recover करेंगे।",
  "अरे... आज {loss} नुकसान। और पढ़ाई करें!",
  "आज लाल: {loss}। कल बदलेंगे!",
  "{loss} नुकसान। शांत रहें, यह process का हिस्सा है!",
  "आज नहीं... {loss} लाल में। इन trades की समीक्षा करें!",
  "लाल दिन: {loss}। कल एक और दिन है!",
];

const NEUTRAL_PHRASES_HI = [
  "एक और trading दिन! पूरी ताकत से चलें!",
  "ध्यान और अनुशासन! लाभ आएगा!",
  "असली traders कभी हार नहीं मानते!",
  "आज इतिहास बनाने का दिन है!",
];

const TRADE_OPENED_PHRASES_HI = [
  "Trade खुला! चलें!",
  "Position खुली! management पर ध्यान!",
  "Entry execute हुई! अब इंतजार!",
  "Trade active! profit करें!",
  "Position शुरू! हमेशा अनुशासन!",
];

const TRADE_TP_PHRASES_HI = [
  "बूम! Take Profit हासिल! {profit}",
  "हरा! TP हासिल! {profit} जेब में!",
  "मिल गया! Take Profit! {profit}",
  "शाबाश! TP बंद {profit} के साथ!",
  "Profit! {profit} सुरक्षित!",
];

const TRADE_SL_PHRASES_HI = [
  "Stop Loss सक्रिय। नुकसान: {loss}",
  "SL हासिल। नुकसान: {loss}। recover करेंगे!",
  "Stop सक्रिय: {loss}। होता है!",
  "{loss} नुकसान। अगला बेहतर होगा!",
  "SL execute: {loss}। अनुशासन बनाए रखें!",
];

// ============================================
// MAPEAMENTO DE FRASES POR IDIOMA
// ============================================
const PHRASES_BY_LANG: Record<string, {
  profit: string[];
  loss: string[];
  neutral: string[];
  tradeOpened: string[];
  tradeTp: string[];
  tradeSl: string[];
}> = {
  'pt-BR': {
    profit: PROFIT_PHRASES_PT,
    loss: LOSS_PHRASES_PT,
    neutral: NEUTRAL_PHRASES_PT,
    tradeOpened: TRADE_OPENED_PHRASES_PT,
    tradeTp: TRADE_TP_PHRASES_PT,
    tradeSl: TRADE_SL_PHRASES_PT,
  },
  'en-US': {
    profit: PROFIT_PHRASES_EN,
    loss: LOSS_PHRASES_EN,
    neutral: NEUTRAL_PHRASES_EN,
    tradeOpened: TRADE_OPENED_PHRASES_EN,
    tradeTp: TRADE_TP_PHRASES_EN,
    tradeSl: TRADE_SL_PHRASES_EN,
  },
  'es-ES': {
    profit: PROFIT_PHRASES_ES,
    loss: LOSS_PHRASES_ES,
    neutral: NEUTRAL_PHRASES_ES,
    tradeOpened: TRADE_OPENED_PHRASES_ES,
    tradeTp: TRADE_TP_PHRASES_ES,
    tradeSl: TRADE_SL_PHRASES_ES,
  },
  'fr-FR': {
    profit: PROFIT_PHRASES_FR,
    loss: LOSS_PHRASES_FR,
    neutral: NEUTRAL_PHRASES_FR,
    tradeOpened: TRADE_OPENED_PHRASES_FR,
    tradeTp: TRADE_TP_PHRASES_FR,
    tradeSl: TRADE_SL_PHRASES_FR,
  },
  'de-DE': {
    profit: PROFIT_PHRASES_DE,
    loss: LOSS_PHRASES_DE,
    neutral: NEUTRAL_PHRASES_DE,
    tradeOpened: TRADE_OPENED_PHRASES_DE,
    tradeTp: TRADE_TP_PHRASES_DE,
    tradeSl: TRADE_SL_PHRASES_DE,
  },
  'it-IT': {
    profit: PROFIT_PHRASES_IT,
    loss: LOSS_PHRASES_IT,
    neutral: NEUTRAL_PHRASES_IT,
    tradeOpened: TRADE_OPENED_PHRASES_IT,
    tradeTp: TRADE_TP_PHRASES_IT,
    tradeSl: TRADE_SL_PHRASES_IT,
  },
  'ja-JP': {
    profit: PROFIT_PHRASES_JA,
    loss: LOSS_PHRASES_JA,
    neutral: NEUTRAL_PHRASES_JA,
    tradeOpened: TRADE_OPENED_PHRASES_JA,
    tradeTp: TRADE_TP_PHRASES_JA,
    tradeSl: TRADE_SL_PHRASES_JA,
  },
  'zh-CN': {
    profit: PROFIT_PHRASES_ZH,
    loss: LOSS_PHRASES_ZH,
    neutral: NEUTRAL_PHRASES_ZH,
    tradeOpened: TRADE_OPENED_PHRASES_ZH,
    tradeTp: TRADE_TP_PHRASES_ZH,
    tradeSl: TRADE_SL_PHRASES_ZH,
  },
  'ko-KR': {
    profit: PROFIT_PHRASES_KO,
    loss: LOSS_PHRASES_KO,
    neutral: NEUTRAL_PHRASES_KO,
    tradeOpened: TRADE_OPENED_PHRASES_KO,
    tradeTp: TRADE_TP_PHRASES_KO,
    tradeSl: TRADE_SL_PHRASES_KO,
  },
  'ru-RU': {
    profit: PROFIT_PHRASES_RU,
    loss: LOSS_PHRASES_RU,
    neutral: NEUTRAL_PHRASES_RU,
    tradeOpened: TRADE_OPENED_PHRASES_RU,
    tradeTp: TRADE_TP_PHRASES_RU,
    tradeSl: TRADE_SL_PHRASES_RU,
  },
  'ar-SA': {
    profit: PROFIT_PHRASES_AR,
    loss: LOSS_PHRASES_AR,
    neutral: NEUTRAL_PHRASES_AR,
    tradeOpened: TRADE_OPENED_PHRASES_AR,
    tradeTp: TRADE_TP_PHRASES_AR,
    tradeSl: TRADE_SL_PHRASES_AR,
  },
  'hi-IN': {
    profit: PROFIT_PHRASES_HI,
    loss: LOSS_PHRASES_HI,
    neutral: NEUTRAL_PHRASES_HI,
    tradeOpened: TRADE_OPENED_PHRASES_HI,
    tradeTp: TRADE_TP_PHRASES_HI,
    tradeSl: TRADE_SL_PHRASES_HI,
  },
};

/**
 * Obtém as frases no idioma correto (fallback para pt-BR)
 */
function getPhrases(language?: string) {
  const lang = language || 'pt-BR';
  return PHRASES_BY_LANG[lang] || PHRASES_BY_LANG['pt-BR'];
}

/**
 * Seleciona uma frase aleatória baseada no resultado (lucro/prejuízo)
 */
export function getRandomPhrase(profit: number, formattedProfit: string, language?: string): string {
  const phrases = getPhrases(language);
  
  if (profit > 0) {
    const phrase = phrases.profit[Math.floor(Math.random() * phrases.profit.length)];
    return phrase.replace('{profit}', formattedProfit);
  } else if (profit < 0) {
    const phrase = phrases.loss[Math.floor(Math.random() * phrases.loss.length)];
    const formattedLoss = formattedProfit.replace('-', ''); // Remover sinal negativo
    return phrase.replace('{loss}', formattedLoss);
  } else {
    return phrases.neutral[Math.floor(Math.random() * phrases.neutral.length)];
  }
}

/**
 * Gera título aleatório simples
 */
export function getRandomTitle(profit: number): string {
  const titles = profit > 0 
    ? ['Resultado do Dia', 'Fechamento Diario', 'Resumo de Hoje']
    : ['Resultado do Dia', 'Fechamento Diario', 'Resumo de Hoje'];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

/**
 * Frase para trade aberto
 */
export function getTradeOpenedPhrase(language?: string): string {
  const phrases = getPhrases(language);
  return phrases.tradeOpened[Math.floor(Math.random() * phrases.tradeOpened.length)];
}

/**
 * Frase para Take Profit
 */
export function getTradeTpPhrase(formattedProfit: string, language?: string): string {
  const phrases = getPhrases(language);
  const phrase = phrases.tradeTp[Math.floor(Math.random() * phrases.tradeTp.length)];
  return phrase.replace('{profit}', formattedProfit);
}

/**
 * Frase para Stop Loss
 */
export function getTradeSlPhrase(formattedLoss: string, language?: string): string {
  const phrases = getPhrases(language);
  const phrase = phrases.tradeSl[Math.floor(Math.random() * phrases.tradeSl.length)];
  const loss = formattedLoss.replace('-', ''); // Remover sinal negativo
  return phrase.replace('{loss}', loss);
}
