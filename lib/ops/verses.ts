/**
 * 구절 — 막혔을 때 눈을 들 곳.
 *
 * 보드 맨 위, 철학 오른쪽에 한 구절이 뜹니다. 열 때마다 다릅니다.
 *
 * ── 왜 바깥에 묻지 않는가 ───────────────────────────────────────────────
 * 스토어 첫 화면은 매일 한 구절을 바깥 API 에서 받아 옵니다(lib/verse.ts).
 * 보드는 그러지 않습니다. 이 화면은 아침마다 여는 화면이고, 바깥이 느린 날에는
 * 그만큼 늦게 열립니다. 그리고 '하루에 하나'가 아니라 '열 때마다 다르게'여야 해서
 * 캐시도 도움이 되지 않습니다.
 *
 * 그래서 여기 담아 둡니다. 본문은 getBible 에서 그대로 받아 적었습니다 —
 * 국문은 개역한글(1961, 퍼블릭 도메인), 영문은 World English Bible(퍼블릭 도메인).
 * 고르는 기준은 하나였습니다: 일하다 막혔을 때 읽어서 다시 손이 움직이는 말.
 *
 * ⚠️ 본문을 손으로 고치지 마세요. 구절을 더하려면 같은 곳에서 받아 적습니다.
 */

export type Verse = {
  ko: string;
  koRef: string;
  en: string;
  enRef: string;
};

export const VERSES: Verse[] = [
  {
    ko: '너는 마음을 강하게 하고 담대히 하라 그들을 두려워 말라 그들 앞에서 떨지 말라 이는 네 하나님 여호와 그가 너와 함께 행하실 것임이라 반드시 너를 떠나지 아니하시며 버리지 아니하시리라 하고',
    koRef: '신명기 31:6',
    en: 'Be strong and courageous. Don’t be afraid or scared of them; for Yahweh your God himself is who goes with you. He will not fail you nor forsake you.',
    enRef: 'Deuteronomy 31:6',
  },
  {
    ko: '내가 네게 명한 것이 아니냐 마음을 강하게 하고 담대히 하라 두려워 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라 하시니라',
    koRef: '여호수아 1:9',
    en: 'Haven’t I commanded you? Be strong and courageous. Don’t be afraid, neither be dismayed: for Yahweh your God is with you wherever you go.',
    enRef: 'Joshua 1:9',
  },
  {
    ko: '내가 곧 저희에게 사자들을 보내어 이르기를 내가 이제 큰 역사를 하니 내려가지 못하겠노라 어찌하여 역사를 떠나 정지하게 하고 너희에게로 내려가겠느냐 하매',
    koRef: '느헤미야 6:3',
    en: 'I sent messengers to them, saying, “I am doing a great work, so that I can’t come down. Why should the work cease, while I leave it, and come down to you?”',
    enRef: 'Nehemiah 6:3',
  },
  {
    ko: '네 마음의 소원대로 허락하시고 네 모든 도모를 이루시기를 원하노라',
    koRef: '시편 20:4',
    en: 'May He grant you your heart’s desire, and fulfill all your counsel.',
    enRef: 'Psalms 20:4',
  },
  {
    ko: '너의 길을 여호와께 맡기라 저를 의지하면 저가 이루시고',
    koRef: '시편 37:5',
    en: 'Commit your way to Yahweh. Trust also in him, and he will do this:',
    enRef: 'Psalms 37:5',
  },
  {
    ko: '주 우리 하나님의 은총을 우리에게 임하게 하사 우리 손의 행사를 우리에게 견고케 하소서 우리 손의 행사를 견고케 하소서',
    koRef: '시편 90:17',
    en: 'Let the favor of the Lord our God be on us; establish the work of our hands for us; yes, establish the work of our hands.',
    enRef: 'Psalms 90:17',
  },
  {
    ko: '여호와께서 집을 세우지 아니하시면 세우는 자의 수고가 헛되며 여호와께서 성을 지키지 아니하시면 파수꾼의 경성함이 허사로다',
    koRef: '시편 127:1',
    en: 'Unless Yahweh builds the house, they labor in vain who build it. Unless Yahweh watches over the city, the watchman guards it in vain.',
    enRef: 'Psalms 127:1',
  },
  {
    ko: '너는 마음을 다하여 여호와를 의뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라',
    koRef: '잠언 3:5-6',
    en: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
    enRef: 'Proverbs 3:5-6',
  },
  {
    ko: '속이는 저울은 여호와께서 미워하셔도 공평한 추는 그가 기뻐하시느니라',
    koRef: '잠언 11:1',
    en: 'A false balance is an abomination to Yahweh, but accurate weights are his delight.',
    enRef: 'Proverbs 11:1',
  },
  {
    ko: '망령되이 얻은 재물은 줄어가고 손으로 모은 것은 늘어가느니라',
    koRef: '잠언 13:11',
    en: 'Wealth gained dishonestly dwindles away, but he who gathers by hand makes it grow.',
    enRef: 'Proverbs 13:11',
  },
  {
    ko: '너의 행사를 여호와께 맡기라 그리하면 너의 경영하는 것이 이루리라',
    koRef: '잠언 16:3',
    en: 'Commit your deeds to Yahweh, and your plans shall succeed.',
    enRef: 'Proverbs 16:3',
  },
  {
    ko: '사람이 마음으로 자기의 길을 계획할지라도 그 걸음을 인도하는 자는 여호와시니라',
    koRef: '잠언 16:9',
    en: 'A man’s heart plans his course, but Yahweh directs his steps.',
    enRef: 'Proverbs 16:9',
  },
  {
    ko: '부지런한 자의 경영은 풍부함에 이를 것이나 조급한 자는 궁핍함에 이를 따름이니라',
    koRef: '잠언 21:5',
    en: 'The plans of the diligent surely lead to profit; and everyone who is hasty surely rushes to poverty.',
    enRef: 'Proverbs 21:5',
  },
  {
    ko: '네가 자기 사업에 근실한 사람을 보았느냐 이러한 사람은 왕 앞에 설 것이요 천한 자 앞에 서지 아니하리라',
    koRef: '잠언 22:29',
    en: 'Do you see a man skilled in his work? He will serve kings. He won’t serve obscure men.',
    enRef: 'Proverbs 22:29',
  },
  {
    ko: '네 일을 밖에서 다스리며 밭에서 예비하고 그 후에 네 집을 세울지니라',
    koRef: '잠언 24:27',
    en: 'Prepare your work outside, and get your fields ready. Afterwards, build your house.',
    enRef: 'Proverbs 24:27',
  },
  {
    ko: '네 양떼의 형편을 부지런히 살피며 네 소떼에 마음을 두라',
    koRef: '잠언 27:23',
    en: 'Know well the state of your flocks, and pay attention to your herds:',
    enRef: 'Proverbs 27:23',
  },
  {
    ko: '천하에 범사가 기한이 있고 모든 목적이 이룰 때가 있나니',
    koRef: '전도서 3:1',
    en: 'For everything there is a season, and a time for every purpose under heaven:',
    enRef: 'Ecclesiastes 3:1',
  },
  {
    ko: '두 사람이 한 사람보다 나음은 저희가 수고함으로 좋은 상을 얻을 것임이라',
    koRef: '전도서 4:9',
    en: 'Two are better than one, because they have a good reward for their labor.',
    enRef: 'Ecclesiastes 4:9',
  },
  {
    ko: '무릇 네 손이 일을 당하는 대로 힘을 다하여 할지어다 네가 장차 들어갈 음부에는 일도 없고 계획도 없고 지식도 없고 지혜도 없음이니라',
    koRef: '전도서 9:10',
    en: 'Whatever your hand finds to do, do it with your might; for there is no work, nor device, nor knowledge, nor wisdom, in Sheol, where you are going.',
    enRef: 'Ecclesiastes 9:10',
  },
  {
    ko: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리의 날개치며 올라감 같을 것이요 달음박질하여도 곤비치 아니하겠고 걸어가도 피곤치 아니하리로다',
    koRef: '이사야 40:31',
    en: 'But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.',
    enRef: 'Isaiah 40:31',
  },
  {
    ko: '두려워 말라 내가 너와 함께 함이니라 놀라지 말라 나는 네 하나님이 됨이니라 내가 너를 굳세게 하리라 참으로 너를 도와주리라 참으로 나의 의로운 오른손으로 너를 붙들리라',
    koRef: '이사야 41:10',
    en: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.',
    enRef: 'Isaiah 41:10',
  },
  {
    ko: '보라 내가 새 일을 행하리니 이제 나타낼 것이라 너희가 그것을 알지 못하겠느냐 정녕히 내가 광야에 길과 사막에 강을 내리니',
    koRef: '이사야 43:19',
    en: 'Behold, I will do a new thing. It springs out now. Don’t you know it? I will even make a way in the wilderness, and rivers in the desert.',
    enRef: 'Isaiah 43:19',
  },
  {
    ko: '나 여호와가 말하노라 너희를 향한 나의 생각은 내가 아나니 재앙이 아니라 곧 평안이요 너희 장래에 소망을 주려하는 생각이라',
    koRef: '예레미야 29:11',
    en: 'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future.',
    enRef: 'Jeremiah 29:11',
  },
  {
    ko: '여호와께서 내게 대답하여 가라사대 너는 이 묵시를 기록하여 판에 명백히 새기되 달려가면서도 읽을 수 있게 하라',
    koRef: '하박국 2:2',
    en: 'Yahweh answered me, “Write the vision, and make it plain on tablets, that he who runs may read it.',
    enRef: 'Habakkuk 2:2',
  },
  {
    ko: '이 묵시는 정한 때가 있나니 그 종말이 속히 이르겠고 결코 거짓되지 아니하리라 비록 더딜지라도 기다리라 지체되지 않고 정녕 응하리라',
    koRef: '하박국 2:3',
    en: 'For the vision is yet for the appointed time, and it hurries toward the end, and won’t prove false. Though it takes time, wait for it; because it will surely come. It won’t delay.',
    enRef: 'Habakkuk 2:3',
  },
  {
    ko: '작은 일의 날이라고 멸시하는 자가 누구냐 이 일곱은 온 세상에 두루 행하는 여호와의 눈이라 다림줄이 스룹바벨의 손에 있음을 보고 기뻐하리라',
    koRef: '스가랴 4:10',
    en: 'Indeed, who despises the day of small things? For these seven shall rejoice, and shall see the plumb line in the hand of Zerubbabel. These are the eyes of Yahweh, which run back and forth through the whole earth.',
    enRef: 'Zechariah 4:10',
  },
  {
    ko: '너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라',
    koRef: '마태복음 6:33',
    en: 'But seek first God’s Kingdom, and his righteousness; and all these things will be given to you as well.',
    enRef: 'Matthew 6:33',
  },
  {
    ko: '그 주인이 이르되 잘 하였도다 착하고 충성된 종아 네가 작은 일에 충성하였으매 내가 많은 것으로 네게 맡기리니 네 주인의 즐거움에 참예할지어다 하고',
    koRef: '마태복음 25:21',
    en: '“His lord said to him, ‘Well done, good and faithful servant. You have been faithful over a few things, I will set you over many things. Enter into the joy of your lord.’',
    enRef: 'Matthew 25:21',
  },
  {
    ko: '지극히 작은 것에 충성된 자는 큰 것에도 충성되고 지극히 작은 것에 불의한 자는 큰 것에도 불의하니라',
    koRef: '누가복음 16:10',
    en: 'He who is faithful in a very little is faithful also in much. He who is dishonest in a very little is also dishonest in much.',
    enRef: 'Luke 16:10',
  },
  {
    ko: '부지런하여 게으르지 말고 열심을 품고 주를 섬기라',
    koRef: '로마서 12:11',
    en: 'not lagging in diligence; fervent in spirit; serving the Lord;',
    enRef: 'Romans 12:11',
  },
  {
    ko: '소망 중에 즐거워하며 환난 중에 참으며 기도에 항상 힘쓰며',
    koRef: '로마서 12:12',
    en: 'rejoicing in hope; enduring in troubles; continuing steadfastly in prayer;',
    enRef: 'Romans 12:12',
  },
  {
    ko: '그런즉 너희가 먹든지 마시든지 무엇을 하든지 다 하나님의 영광을 위하여 하라',
    koRef: '고린도전서 10:31',
    en: 'Whether therefore you eat, or drink, or whatever you do, do all to the glory of God.',
    enRef: '1 Corinthians 10:31',
  },
  {
    ko: '그러므로 내 사랑하는 형제들아 견고하며 흔들리지 말며 항상 주의 일에 더욱 힘쓰는 자들이 되라 이는 너희 수고가 주 안에서 헛되지 않은 줄을 앎이니라',
    koRef: '고린도전서 15:58',
    en: 'Therefore, my beloved brothers, be steadfast, immovable, always abounding in the Lord’s work, because you know that your labor is not in vain in the Lord.',
    enRef: '1 Corinthians 15:58',
  },
  {
    ko: '우리가 선을 행하되 낙심하지 말지니 피곤하지 아니하면 때가 이르매 거두리라',
    koRef: '갈라디아서 6:9',
    en: 'Let us not be weary in doing good, for we will reap in due season, if we don’t give up.',
    enRef: 'Galatians 6:9',
  },
  {
    ko: '우리는 그의 만드신 바라 그리스도 예수 안에서 선한 일을 위하여 지으심을 받은 자니 이 일은 하나님이 전에 예비하사 우리로 그 가운데서 행하게 하려 하심이니라',
    koRef: '에베소서 2:10',
    en: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.',
    enRef: 'Ephesians 2:10',
  },
  {
    ko: '아무 것도 염려하지 말고 오직 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라',
    koRef: '빌립보서 4:6',
    en: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.',
    enRef: 'Philippians 4:6',
  },
  {
    ko: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라',
    koRef: '빌립보서 4:13',
    en: 'I can do all things through Christ, who strengthens me.',
    enRef: 'Philippians 4:13',
  },
  {
    ko: '또 무엇을 하든지 말에나 일에나 다 주 예수의 이름으로 하고 그를 힘입어 하나님 아버지께 감사하라',
    koRef: '골로새서 3:17',
    en: 'Whatever you do, in word or in deed, do all in the name of the Lord Jesus, giving thanks to God the Father, through him.',
    enRef: 'Colossians 3:17',
  },
  {
    ko: '무슨 일을 하든지 마음을 다하여 주께 하듯 하고 사람에게 하듯 하지 말라',
    koRef: '골로새서 3:23',
    en: 'And whatever you do, work heartily, as for the Lord, and not for men,',
    enRef: 'Colossians 3:23',
  },
  {
    ko: '또 너희에게 명한 것 같이 종용하여 자기 일을 하고 너희 손으로 일하기를 힘쓰라',
    koRef: '데살로니가전서 4:11',
    en: 'and that you make it your ambition to lead a quiet life, and to do your own business, and to work with your own hands, even as we instructed you;',
    enRef: '1 Thessalonians 4:11',
  },
  {
    ko: '하나님이 우리에게 주신 것은 두려워하는 마음이 아니요 오직 능력과 사랑과 근신하는 마음이니',
    koRef: '디모데후서 1:7',
    en: 'For God didn’t give us a spirit of fear, but of power, love, and self-control.',
    enRef: '2 Timothy 1:7',
  },
  {
    ko: '믿음은 바라는 것들의 실상이요 보지 못하는 것들의 증거니',
    koRef: '히브리서 11:1',
    en: 'Now faith is assurance of things hoped for, proof of things not seen.',
    enRef: 'Hebrews 11:1',
  },
  {
    ko: '이러므로 우리에게 구름 같이 둘러싼 허다한 증인들이 있으니 모든 무거운 것과 얽매이기 쉬운 죄를 벗어 버리고 인내로써 우리 앞에 당한 경주를 경주하며',
    koRef: '히브리서 12:1',
    en: 'Therefore let us also, seeing we are surrounded by so great a cloud of witnesses, lay aside every weight and the sin which so easily entangles us, and let us run with patience the race that is set before us,',
    enRef: 'Hebrews 12:1',
  },
  {
    ko: '너희 중에 누구든지 지혜가 부족하거든 모든 사람에게 후히 주시고 꾸짖지 아니하시는 하나님께 구하라 그리하면 주시리라',
    koRef: '야고보서 1:5',
    en: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him.',
    enRef: 'James 1:5',
  },
  {
    ko: '각각 은사를 받은 대로 하나님의 각양 은혜를 맡은 선한 청지기 같이 서로 봉사하라',
    koRef: '베드로전서 4:10',
    en: 'As each has received a gift, employ it in serving one another, as good managers of the grace of God in its various forms.',
    enRef: '1 Peter 4:10',
  },
];

/**
 * 서로 다른 구절 여럿을 무작위로 뽑습니다.
 *
 * 화면이 한 장을 그리면서 여러 장을 함께 받아 두는 이유는, 다음 구절을 보려고
 * 서버에 다시 묻지 않기 위해서입니다 — 버튼을 누르면 그 자리에서 바뀝니다.
 * 한 바퀴를 다 돌면 다시 처음으로 갑니다 (다음 새로고침에 새로 뽑힙니다).
 */
export function pickVerses(count = 8): Verse[] {
  const pool = [...VERSES];
  const out: Verse[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i += 1) {
    const at = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(at, 1)[0]);
  }
  return out;
}
