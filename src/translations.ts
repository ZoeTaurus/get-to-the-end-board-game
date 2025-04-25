export interface Translation {
  login: {
    title: string;
    username: string;
    password: string;
    login: string;
    register: string;
    language: string;
    error: string;
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
      error: 'Invalid username or password'
    },
    game: {
      title: 'Game',
      startGame: 'Start Game',
      backToHome: 'Back to Home',
      yourTurn: 'Your turn',
      opponentTurn: 'Opponent\'s turn',
      youWin: 'You win!',
      youLose: 'You lose!',
      draw: 'It\'s a draw!',
      waitingForOpponent: 'Waiting for opponent...',
      searchingForGame: 'Searching for game...',
      logout: 'Logout',
      wins: 'Wins',
      selectPiece: 'Select Piece',
      waitingForMove: 'Waiting for move...',
      timeLeft: 'Time left: {seconds} seconds'
    },
    help: {
      title: 'How to Play',
      pieces: 'Pieces',
      personPiece: 'Person-shaped piece',
      personMove: 'Can move back, forth, and sideways',
      personEat: 'Can only eat opponent\'s pieces diagonally',
      circlePiece: 'Circle-shaped piece',
      circleMove: 'Can move in any direction',
      circleEat: 'Can eat in any direction',
      circleLimit: 'Can only eat 2 pieces before getting full',
      howToWin: 'How to Win',
      winByCapture: 'Eat all opponent\'s pieces, OR',
      winByReach: 'Get to the other side of the board',
      setup: 'Setup',
      setupDescription: 'Starting from the left: Place 2 person-shaped pieces, then a circle-shaped piece, and finally another person-shaped piece.',
      watchVideo: 'Still don\'t get it? Watch this video!',
      watchButton: 'Watch Tutorial Video'
    },
    logout: {
      confirm: 'Are you sure you want to logout?',
      yes: 'Yes',
      no: 'No'
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
      error: 'Usuario o contraseña inválidos'
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
      wins: 'Victorias',
      selectPiece: 'Seleccionar Ficha',
      waitingForMove: 'Esperando movimiento...',
      timeLeft: 'Tiempo restante: {seconds} segundos'
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
      winByCapture: 'Comer todas las piezas del oponente, O',
      winByReach: 'Llegar al otro lado del tablero',
      setup: 'Configuración',
      setupDescription: 'Empezando desde la izquierda: Coloca 2 piezas con forma de persona, luego una pieza con forma de círculo, y finalmente otra pieza con forma de persona.',
      watchVideo: '¿Todavía no lo entiendes? ¡Mira este video!',
      watchButton: 'Ver Video Tutorial'
    },
    logout: {
      confirm: '¿Estás seguro de que quieres cerrar sesión?',
      yes: 'Sí',
      no: 'No'
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
      error: '用户名或密码无效'
    },
    game: {
      title: '游戏',
      startGame: '开始游戏',
      backToHome: '返回首页',
      yourTurn: '你的回合',
      opponentTurn: '对手的回合',
      youWin: '你赢了！',
      youLose: '你输了！',
      draw: '平局！',
      waitingForOpponent: '等待对手...',
      searchingForGame: '正在寻找游戏...',
      logout: '退出登录',
      wins: '胜利',
      selectPiece: '选择棋子',
      waitingForMove: '等待移动...',
      timeLeft: '剩余时间：{seconds}秒'
    },
    help: {
      title: '游戏规则',
      pieces: '棋子',
      personPiece: '人形棋子',
      personMove: '可以前后左右移动',
      personEat: '只能斜着吃对手的棋子',
      circlePiece: '圆形棋子',
      circleMove: '可以向任何方向移动',
      circleEat: '可以向任何方向吃子',
      circleLimit: '只能吃2个棋子就会吃饱',
      howToWin: '如何获胜',
      winByCapture: '吃掉对手所有棋子，或者',
      winByReach: '到达棋盘的另一边',
      setup: '初始设置',
      setupDescription: '从左边开始：放置2个人形棋子，然后一个圆形棋子，最后再一个人形棋子。',
      watchVideo: '还是不明白？观看这个视频！',
      watchButton: '观看教程视频'
    },
    logout: {
      confirm: '确定要退出登录吗？',
      yes: '是',
      no: '否'
    }
  }
};

export const languageList = [
  'English',
  'Spanish',
  'Chinese',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Bengali',
  'Punjabi',
  'Turkish',
  'Vietnamese',
  'Thai',
  'Indonesian',
  'Malay',
  'Filipino',
  'Urdu',
  'Persian',
  'O\'zbek'
];

// Add English as fallback for any missing languages
for (const language of languageList) {
  if (!translations[language]) {
    translations[language] = translations.English;
  }
}

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