export interface Translation {
  login: {
    title: string;
    username: string;
    password: string;
    login: string;
    register: string;
    language: string;
    error: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    loginButton: string;
    chooseUsername: string;
    usernamePlaceholder: string;
    startPlaying: string;
    userNotFound: string;
    incorrectPassword: string;
    emailRequired: string;
    usernameTaken: string;
    emailRegistered: string;
    passwordTooShort: string;
    passwordsDontMatch: string;
    confirmPassword: string;
    passwordReset: string;
    resetEmail: string;
    verificationCode: string;
    newPassword: string;
    confirmNewPassword: string;
    sendCode: string;
    verifyCode: string;
    resetPassword: string;
    backToLogin: string;
  };
  game: {
    title: string;
    startGame: string;
    backToHome: string;
    yourTurn: string;
    opponentTurn: string;
    youWin: string;
    youLose: string;
    draw: string;
    waitingForOpponent: string;
    searchingForGame: string;
    logout: string;
    wins: string;
    selectPiece: string;
    waitingForMove: string;
    timeLeft: string;
    turnMessage: string;
  };
  help: {
    title: string;
    pieces: string;
    personPiece: string;
    personMove: string;
    personEat: string;
    circlePiece: string;
    circleMove: string;
    circleEat: string;
    circleLimit: string;
    howToWin: string;
    winByCapture: string;
    winByReach: string;
    setup: string;
    setupDescription: string;
    watchVideo: string;
    watchButton: string;
  };
  bots: {
    easyBot: string;
    normalBot: string;
    hardBot: string;
    proBot: string;
    wizardBot: string;
    selectDifficulty: string;
    easyDescription: string;
    normalDescription: string;
    hardDescription: string;
    proDescription: string;
    wizardDescription: string;
    goodForBeginners: string;
    challengingButFair: string;
    forExperiencedPlayers: string;
    forAdvancedPlayers: string;
    forMasterPlayers: string;
  };
  navigation: {
    home: string;
    bots: string;
    private: string;
    help: string;
  };
  private: {
    title: string;
    subtitle: string;
    enterGameCode: string;
    joinGame: string;
    generateGameCode: string;
    createNewGame: string;
    generateCodeDescription: string;
    gameCreated: string;
    shareCodeWithFriend: string;
    gameCode: string;
    codeExpiresIn: string;
    cancel: string;
    playOnSameDevice: string;
    playWithSomeoneOnDevice: string;
    noAccountNeeded: string;
    enterOpponentsNickname: string;
    nicknameNotSaved: string;
    opponentsNickname: string;
    startGame: string;
  };
  logout: {
    confirm: string;
    yes: string;
    no: string;
  };
}

export const translations: Record<string, Translation> = {
  English: {
    login: {
      title: 'Login',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      register: 'Register',
      language: 'Language',
      error: 'Invalid username or password',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      loginButton: 'Login',
      chooseUsername: 'Choose your username',
      usernamePlaceholder: 'Enter username (3-15 characters)',
      startPlaying: 'Start Playing',
      userNotFound: 'User not found',
      incorrectPassword: 'Incorrect password',
      emailRequired: 'Please enter your email address',
      usernameTaken: 'Username is already taken',
      emailRegistered: 'Email is already registered',
      passwordTooShort: 'Password must be at least 4 characters',
      passwordsDontMatch: 'Passwords do not match',
      confirmPassword: 'Confirm Password',
      passwordReset: 'Reset Password',
      resetEmail: 'Reset Email',
      verificationCode: 'Verification Code',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      sendCode: 'Send Code',
      verifyCode: 'Verify Code',
      resetPassword: 'Reset Password',
      backToLogin: 'Back to Login'
    },
    game: {
      title: 'Game',
      startGame: 'Start Game',
      backToHome: 'Back to Home',
      yourTurn: 'Your Turn',
      opponentTurn: 'Opponent\'s Turn',
      youWin: 'You Win!',
      youLose: 'You Lose!',
      draw: 'It\'s a Draw!',
      waitingForOpponent: 'Waiting for opponent...',
      searchingForGame: 'Searching for game...',
      logout: 'Logout',
      wins: '{player} wins!',
      selectPiece: 'Select a piece to move',
      waitingForMove: 'Waiting for {opponent} to move...',
      timeLeft: '{seconds} seconds remaining',
      turnMessage: "It's {player}'s turn. Select a piece to move."
    },
    help: {
      title: 'How to Play',
      pieces: 'Pieces',
      personPiece: 'Person-shaped piece',
      personMove: 'Can move backwards, forwards and sideways',
      personEat: 'Can only eat opponent pieces diagonally',
      circlePiece: 'Circle-shaped piece',
      circleMove: 'Can move in any direction',
      circleEat: 'Can eat in any direction',
      circleLimit: 'Can only eat 2 pieces before getting full',
      howToWin: 'How to Win',
      winByCapture: 'Eat all opponent pieces, OR',
      winByReach: 'Reach the other side of the board',
      setup: 'Setup',
      setupDescription: 'Starting from the left: Place 2 person-shaped pieces, then one circle-shaped piece, and finally another person-shaped piece.',
      watchVideo: 'Still don\'t understand? Watch this video!',
      watchButton: 'Watch Tutorial Video'
    },
    bots: {
      easyBot: 'Easy Bot',
      normalBot: 'Normal Bot',
      hardBot: 'Hard Bot',
      proBot: 'Pro Bot',
      wizardBot: 'Wizard Bot',
      selectDifficulty: 'Select Difficulty',
      easyDescription: 'Random moves, occasionally captures',
      normalDescription: 'Smart moves, tries to advance',
      hardDescription: 'Strategic moves, looks for wins',
      proDescription: 'AI-powered moves with prediction',
      wizardDescription: 'Complex AI with deep thinking',
      goodForBeginners: 'Good for beginners',
      challengingButFair: 'Challenging but fair',
      forExperiencedPlayers: 'For experienced players',
      forAdvancedPlayers: 'For advanced players',
      forMasterPlayers: 'For master players'
    },
    navigation: {
      home: 'Home',
      bots: 'Bots',
      private: 'Private',
      help: 'Help'
    },
    logout: {
      confirm: 'Are you sure you want to logout?',
      yes: 'Yes',
      no: 'No'
    },
    private: {
      title: 'Private Games',
      subtitle: 'Create or join private games with friends',
      enterGameCode: 'Enter Game Code',
      joinGame: 'Join Game',
      generateGameCode: 'Generate Game Code',
      createNewGame: 'Create a new private game',
      generateCodeDescription: 'Generate a 4-character code for friends',
      gameCreated: 'Game Created!',
      shareCodeWithFriend: 'Share this code with your friend',
      gameCode: 'Game Code',
      codeExpiresIn: 'Code expires in',
      cancel: 'Cancel',
      playOnSameDevice: 'Play on Same Device',
      playWithSomeoneOnDevice: 'Play with someone on this device',
      noAccountNeeded: 'No account needed, just enter nicknames',
      enterOpponentsNickname: 'Enter Opponent\'s Nickname',
      nicknameNotSaved: 'This won\'t be saved - just for this game',
      opponentsNickname: 'Opponent\'s nickname',
      startGame: 'Start Game'
    }
  },
  Spanish: {
    login: {
      title: 'Iniciar Sesión',
      username: 'Usuario',
      password: 'Contraseña',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      language: 'Idioma',
      error: 'Usuario o contraseña inválidos',
      emailPlaceholder: 'Ingrese su correo electrónico',
      passwordPlaceholder: 'Ingrese su contraseña',
      loginButton: 'Iniciar Sesión',
      chooseUsername: 'Elija su nombre de usuario',
      usernamePlaceholder: 'Ingrese nombre de usuario (3-15 caracteres)',
      startPlaying: 'Empezar a jugar',
      userNotFound: 'Usuario no encontrado',
      incorrectPassword: 'Contraseña incorrecta',
      emailRequired: 'Por favor ingrese su dirección de correo electrónico',
      usernameTaken: 'Nombre de usuario ya está en uso',
      emailRegistered: 'Correo electrónico ya está registrado',
      passwordTooShort: 'La contraseña debe tener al menos 4 caracteres',
      passwordsDontMatch: 'Las contraseñas no coinciden',
      confirmPassword: 'Confirmar Contraseña',
      passwordReset: 'Restablecer Contraseña',
      resetEmail: 'Restablecer Correo',
      verificationCode: 'Código de Verificación',
      newPassword: 'Nueva Contraseña',
      confirmNewPassword: 'Confirmar Nueva Contraseña',
      sendCode: 'Enviar Código',
      verifyCode: 'Verificar Código',
      resetPassword: 'Restablecer Contraseña',
      backToLogin: 'Volver al Login'
    },
    game: {
      title: 'Juego',
      startGame: 'Iniciar Juego',
      backToHome: 'Volver al Inicio',
      yourTurn: 'Tu turno',
      opponentTurn: 'Turno del oponente',
      youWin: '¡Ganaste!',
      youLose: '¡Perdiste!',
      draw: '¡Es un empate!',
      waitingForOpponent: 'Esperando al oponente...',
      searchingForGame: 'Buscando partida...',
      logout: 'Cerrar Sesión',
      wins: '¡{player} gana!',
      selectPiece: 'Selecciona una pieza para mover',
      waitingForMove: 'Esperando a que {opponent} mueva...',
      timeLeft: '{seconds} segundos restantes',
      turnMessage: "Es el turno de {player}. Selecciona una pieza para mover."
    },
    help: {
      title: 'Cómo Jugar',
      pieces: 'Piezas',
      personPiece: 'Pieza con forma de persona',
      personMove: 'Puede moverse hacia atrás, adelante y hacia los lados',
      personEat: 'Solo puede comer piezas del oponente en diagonal',
      circlePiece: 'Pieza con forma de círculo',
      circleMove: 'Puede moverse en cualquier dirección',
      circleEat: 'Puede comer en cualquier dirección',
      circleLimit: 'Solo puede comer 2 piezas antes de llenarse',
      howToWin: 'Cómo Ganar',
      winByCapture: 'Come todas las piezas del oponente, O',
      winByReach: 'Llega al otro lado del tablero',
      setup: 'Configuración',
      setupDescription: 'Empezando desde la izquierda: Coloca 2 piezas con forma de persona, luego una pieza con forma de círculo, y finalmente otra pieza con forma de persona.',
      watchVideo: '¿Todavía no lo entiendes? ¡Mira este video!',
      watchButton: 'Ver Video Tutorial'
    },
    bots: {
      easyBot: 'Bot Fácil',
      normalBot: 'Bot Normal',
      hardBot: 'Bot Difícil',
      proBot: 'Bot Pro',
      wizardBot: 'Bot Mago',
      selectDifficulty: 'Seleccionar Dificultad',
      easyDescription: 'Movimientos aleatorios, ocasionalmente captura',
      normalDescription: 'Movimientos inteligentes, trata de avanzar',
      hardDescription: 'Movimientos estratégicos, busca victorias',
      proDescription: 'Movimientos con IA y predicción',
      wizardDescription: 'IA compleja con pensamiento profundo',
      goodForBeginners: 'Bueno para principiantes',
      challengingButFair: 'Desafiante pero justo',
      forExperiencedPlayers: 'Para jugadores experimentados',
      forAdvancedPlayers: 'Para jugadores avanzados',
      forMasterPlayers: 'Para jugadores maestros'
    },
    navigation: {
      home: 'Inicio',
      bots: 'Bots',
      private: 'Privado',
      help: 'Ayuda'
    },
    logout: {
      confirm: '¿Estás seguro de que quieres cerrar sesión?',
      yes: 'Sí',
      no: 'No'
    },
    private: {
      title: 'Juegos Privados',
      subtitle: 'Crea o únete a juegos privados con amigos',
      enterGameCode: 'Ingresar Código de Juego',
      joinGame: 'Unirse al Juego',
      generateGameCode: 'Generar Código de Juego',
      createNewGame: 'Crear un nuevo juego privado',
      generateCodeDescription: 'Generar un código de 4 caracteres para amigos',
      gameCreated: '¡Juego Creado!',
      shareCodeWithFriend: 'Comparte este código con tu amigo',
      gameCode: 'Código de Juego',
      codeExpiresIn: 'El código expira en',
      cancel: 'Cancelar',
      playOnSameDevice: 'Jugar en el Mismo Dispositivo',
      playWithSomeoneOnDevice: 'Jugar con alguien en este dispositivo',
      noAccountNeeded: 'No se necesita cuenta, solo ingresa apodos',
      enterOpponentsNickname: 'Ingresar Apodo del Oponente',
      nicknameNotSaved: 'Esto no se guardará - solo para este juego',
      opponentsNickname: 'Apodo del oponente',
      startGame: 'Comenzar Juego'
    }
  },
  Chinese: {
    login: {
      title: '登录',
      username: '用户名',
      password: '密码',
      login: '登录',
      register: '注册',
      language: '语言',
      error: '用户名或密码无效',
      emailPlaceholder: '输入邮箱',
      passwordPlaceholder: '输入密码',
      loginButton: '登录',
      chooseUsername: '选择用户名',
      usernamePlaceholder: '输入用户名（3-15个字符）',
      startPlaying: '开始游戏',
      userNotFound: '用户未找到',
      incorrectPassword: '密码错误',
      emailRequired: '请输入邮箱地址',
      usernameTaken: '用户名已被使用',
      emailRegistered: '邮箱已被注册',
      passwordTooShort: '密码至少需要4个字符',
      passwordsDontMatch: '密码不匹配',
      confirmPassword: '确认密码',
      passwordReset: '重置密码',
      resetEmail: '重置邮箱',
      verificationCode: '验证码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      sendCode: '发送验证码',
      verifyCode: '验证验证码',
      resetPassword: '重置密码',
      backToLogin: '返回登录'
    },
    game: {
      title: '游戏',
      startGame: '开始游戏',
      backToHome: '返回首页',
      yourTurn: '你的回合',
      opponentTurn: '对手回合',
      youWin: '你赢了！',
      youLose: '你输了！',
      draw: '平局！',
      waitingForOpponent: '等待对手...',
      searchingForGame: '搜索游戏中...',
      logout: '退出登录',
      wins: '{player}赢了！',
      selectPiece: '选择要移动的棋子',
      waitingForMove: '等待{opponent}移动...',
      timeLeft: '剩余{seconds}秒',
      turnMessage: "轮到{player}了。选择要移动的棋子。"
    },
    help: {
      title: '游戏规则',
      pieces: '棋子',
      personPiece: '人形棋子',
      personMove: '可以向前、后、左、右移动',
      personEat: '只能斜向吃掉对手棋子',
      circlePiece: '圆形棋子',
      circleMove: '可以向任何方向移动',
      circleEat: '可以向任何方向吃掉棋子',
      circleLimit: '只能吃掉2个棋子就会吃饱',
      howToWin: '如何获胜',
      winByCapture: '吃掉所有对手棋子，或者',
      winByReach: '到达棋盘另一边',
      setup: '初始布局',
      setupDescription: '从左开始：放置2个人形棋子，然后一个圆形棋子，最后再一个人形棋子。',
      watchVideo: '还是不明白？看这个视频！',
      watchButton: '观看教程视频'
    },
    bots: {
      easyBot: '简单机器人',
      normalBot: '普通机器人',
      hardBot: '困难机器人',
      proBot: '专业机器人',
      wizardBot: '巫师机器人',
      selectDifficulty: '选择难度',
      easyDescription: '随机移动，偶尔吃掉棋子',
      normalDescription: '智能移动，尝试前进',
      hardDescription: '战略移动，寻找胜利',
      proDescription: 'AI驱动的移动和预测',
      wizardDescription: '复杂AI，深度思考',
      goodForBeginners: '适合初学者',
      challengingButFair: '有挑战性但公平',
      forExperiencedPlayers: '适合有经验的玩家',
      forAdvancedPlayers: '适合高级玩家',
      forMasterPlayers: '适合大师级玩家'
    },
    navigation: {
      home: '首页',
      bots: '机器人',
      private: '私人',
      help: '帮助'
    },
    logout: {
      confirm: '你确定要退出登录吗？',
      yes: '是',
      no: '否'
    },
    private: {
      title: '私人游戏',
      subtitle: '创建或加入与朋友的私人游戏',
      enterGameCode: '输入游戏代码',
      joinGame: '加入游戏',
      generateGameCode: '生成游戏代码',
      createNewGame: '创建新的私人游戏',
      generateCodeDescription: '为朋友生成4位字符代码',
      gameCreated: '游戏已创建！',
      shareCodeWithFriend: '与朋友分享此代码',
      gameCode: '游戏代码',
      codeExpiresIn: '代码过期时间',
      cancel: '取消',
      playOnSameDevice: '在同一设备上玩',
      playWithSomeoneOnDevice: '与设备上的某人一起玩',
      noAccountNeeded: '无需账户，只需输入昵称',
      enterOpponentsNickname: '输入对手昵称',
      nicknameNotSaved: '这不会被保存 - 仅用于此游戏',
      opponentsNickname: '对手昵称',
      startGame: '开始游戏'
    }
  }
};

// Language display names mapping - Top 3 fully working languages
export const languageDisplayNames: Record<string, string> = {
  'English': 'English',
  'Spanish': 'Español',
  'Chinese': '中文'
};

export const languageList = Object.keys(languageDisplayNames);

export function getTranslation(language: string): Translation {
  return translations[language] || translations.English;
}

export function formatMessage(message: string, params: Record<string, string>): string {
  let result = message;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

export function getLanguageDisplayName(language: string): string {
  return languageDisplayNames[language] || language;
}

