export interface InspiritionalQuote {
  text: string;
  author: string;
  role?: string;
}

export const INSPIRATIONAL_QUOTES: InspiritionalQuote[] = [
  {
    text: "Os amadores esperam pela inspiração. O resto de nós simplesmente levanta e vai trabalhar.",
    author: "Steven Pressfield",
    role: "Autor de A Guerra da Arte"
  },
  {
    text: "A criatividade é inteligência se divertindo.",
    author: "Albert Einstein",
    role: "Físico"
  },
  {
    text: "Comece. O resto vem fazendo.",
    author: "Austin Kleon",
    role: "Autor de Roube Como um Artista"
  },
  {
    text: "Você não precisa ser ótimo para começar, mas precisa começar para ser ótimo.",
    author: "Zig Ziglar",
    role: "Palestrante"
  },
  {
    text: "A única maneira de fazer um ótimo trabalho é amar o que você faz.",
    author: "Steve Jobs",
    role: "Fundador da Apple"
  },
  {
    text: "A resistência é proporcional ao tamanho do sonho.",
    author: "Steven Pressfield",
    role: "Autor de A Guerra da Arte"
  },
  {
    text: "Mostre seu trabalho. Consistência vence talento.",
    author: "Austin Kleon",
    role: "Autor de Show Your Work"
  },
  {
    text: "Feito é melhor que perfeito.",
    author: "Sheryl Sandberg",
    role: "Ex-COO do Facebook"
  },
  {
    text: "A prática não leva à perfeição. A prática leva à permanência.",
    author: "Seth Godin",
    role: "Autor de A Vaca Roxa"
  },
  {
    text: "Criar é o ato mais generoso que existe.",
    author: "Brené Brown",
    role: "Pesquisadora"
  },
  {
    text: "Não espere. O tempo nunca será 'ideal'.",
    author: "Napoleon Hill",
    role: "Autor de Quem Pensa Enriquece"
  },
  {
    text: "A inspiração existe, mas precisa te encontrar trabalhando.",
    author: "Pablo Picasso",
    role: "Artista"
  },
  {
    text: "Pequenos hábitos não somam. Eles se multiplicam.",
    author: "James Clear",
    role: "Autor de Hábitos Atômicos"
  },
  {
    text: "Tudo o que você sempre quis está do outro lado do medo.",
    author: "George Addair",
    role: "Empreendedor"
  },
  {
    text: "A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor é agora.",
    author: "Provérbio Chinês"
  },
  {
    text: "Documente, não crie. Mostre o processo.",
    author: "Gary Vaynerchuk",
    role: "Empreendedor e Creator"
  },
  {
    text: "O trabalho que você faz enquanto procrastina é provavelmente o trabalho que deveria fazer pelo resto da vida.",
    author: "Jessica Hische",
    role: "Designer"
  },
  {
    text: "Seja você mesmo; todos os outros já estão sendo usados.",
    author: "Oscar Wilde",
    role: "Escritor"
  },
  {
    text: "Criatividade requer coragem.",
    author: "Henri Matisse",
    role: "Artista"
  },
  {
    text: "A única diferença entre um dia bom e um dia ruim é sua atitude.",
    author: "Dennis S. Brown",
    role: "Autor"
  },
  {
    text: "O processo é o caminho.",
    author: "Casey Neistat",
    role: "Cineasta e YouTuber"
  },
  {
    text: "Se você quer algo novo, você precisa parar de fazer algo velho.",
    author: "Peter Drucker",
    role: "Consultor de Gestão"
  },
  {
    text: "A arte não é o que você vê, mas o que você faz os outros verem.",
    author: "Edgar Degas",
    role: "Artista"
  },
  {
    text: "Faça o que você pode, com o que você tem, onde você está.",
    author: "Theodore Roosevelt",
    role: "Ex-Presidente dos EUA"
  },
  {
    text: "O segredo de ir em frente é começar.",
    author: "Mark Twain",
    role: "Escritor"
  }
];

/**
 * Retorna uma frase aleatória da coleção
 * Muda a cada chamada/refresh da página
 */
export function getRandomQuote(): InspiritionalQuote {
  const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
  return INSPIRATIONAL_QUOTES[randomIndex];
}

/**
 * Retorna a mesma frase durante o dia todo
 * Baseado no dia do ano para consistência
 */
export function getDailyQuote(): InspiritionalQuote {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % INSPIRATIONAL_QUOTES.length;
  return INSPIRATIONAL_QUOTES[index];
}
