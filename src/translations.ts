interface Translation {
  login: {
    title: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    loginButton: string;
    chooseUsername: string;
    usernamePlaceholder: string;
    startPlaying: string;
    language: string;
  };
  game: {
    yourTurn: string;
    opponentTurn: string;
    selectPiece: string;
    waitingForMove: string;
    wins: string;
    backToHome: string;
    timeLeft: string;
  };
}

const translations: { [key: string]: Translation } = {
  English: {
    login: {
      title: "Login",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      loginButton: "Login",
      chooseUsername: "Choose Your Username",
      usernamePlaceholder: "Enter username",
      startPlaying: "Start Playing",
      language: "Language"
    },
    game: {
      yourTurn: "Your Turn",
      opponentTurn: "{opponent}'s Turn",
      selectPiece: "Select a piece to move.",
      waitingForMove: "Waiting for {opponent}'s move...",
      wins: "{player} WINS!",
      backToHome: "Back to Home",
      timeLeft: "Time left: {seconds}s"
    }
  },
  Spanish: {
    login: {
      title: "Iniciar Sesión",
      emailPlaceholder: "Correo electrónico",
      passwordPlaceholder: "Contraseña",
      loginButton: "Iniciar Sesión",
      chooseUsername: "Elige tu nombre de usuario",
      usernamePlaceholder: "Ingresa nombre de usuario",
      startPlaying: "Empezar a Jugar",
      language: "Idioma"
    },
    game: {
      yourTurn: "Tu Turno",
      opponentTurn: "Turno de {opponent}",
      selectPiece: "Selecciona una pieza para mover.",
      waitingForMove: "Esperando el movimiento de {opponent}...",
      wins: "¡{player} GANA!",
      backToHome: "Volver al Inicio",
      timeLeft: "Tiempo restante: {seconds}s"
    }
  },
  Chinese: {
    login: {
      title: "登录",
      emailPlaceholder: "邮箱",
      passwordPlaceholder: "密码",
      loginButton: "登录",
      chooseUsername: "选择用户名",
      usernamePlaceholder: "输入用户名",
      startPlaying: "开始游戏",
      language: "语言"
    },
    game: {
      yourTurn: "你的回合",
      opponentTurn: "{opponent}的回合",
      selectPiece: "选择一个棋子移动。",
      waitingForMove: "等待{opponent}移动...",
      wins: "{player}获胜！",
      backToHome: "返回主页",
      timeLeft: "剩余时间：{seconds}秒"
    }
  }
};

export const getTranslation = (language: string): Translation => {
  return translations[language] || translations.English;
};

export const formatMessage = (message: string, params: { [key: string]: string } = {}): string => {
  return message.replace(/{(\w+)}/g, (match, key) => params[key] || match);
}; 