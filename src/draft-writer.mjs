const SHOT_BLUEPRINTS = [
  {
    label: 'threshold call',
    purpose: '注意到不该出现的信号，在越过边界前停住',
    performance: '克制的迟疑；握住关键物的手指收紧',
    shotSize: 'wide establishing shot',
    lens: '24mm controlled wide lens',
    camera: 'slow push toward the threshold',
    composition: '主体压在下三分之一，入口或信号居中形成压迫性负空间',
    blocking: '主体先停住不跨线，手机或关键物压低在胸前'
  },
  {
    label: 'object wound',
    purpose: '查看把当下和旧伤连接起来的关键物',
    performance: '手指压得过紧；呼吸变短但表情仍然收住',
    shotSize: 'macro insert',
    lens: '85mm macro lens',
    camera: 'locked macro frame',
    composition: '关键物占据画面中心，主体指尖从边缘进入，背景只保留场景色块',
    blocking: '主体不说话，只用手指和停顿完成信息确认'
  },
  {
    label: 'entry',
    purpose: '从普通空间进入禁区',
    performance: '走得很慢，但不回头',
    shotSize: 'medium back shot',
    lens: '35mm natural perspective lens',
    camera: 'tracking behind the subject',
    composition: '主体背影挡住一半入口，画面前景保留雨水或门框遮挡',
    blocking: '主体肩膀先进画，脚步跨过边界后仍然保持犹豫'
  },
  {
    label: 'world reveal',
    purpose: '进入主体空间，意识到它重新活了过来',
    performance: '肩膀微沉，旧记忆变成可触摸的现实',
    shotSize: 'wide environmental shot',
    lens: '28mm controlled wide lens',
    camera: 'slow lateral slide',
    composition: '空间纵深从主体身侧展开，异常光源切出一条明确通道',
    blocking: '主体走到画面边缘停下，让场景自己占据主导'
  },
  {
    label: 'identity detail',
    purpose: '触碰过去的职业或私人锚点',
    performance: '手在落下前悬停半秒',
    shotSize: 'medium close-up',
    lens: '50mm intimate lens',
    camera: 'small push-in',
    composition: '人物半身和锚点同框，锚点在前景虚化后慢慢清晰',
    blocking: '主体伸手到一半停住，视线先落在锚点再落回空间'
  },
  {
    label: 'sound trigger',
    purpose: '听见不该存在的声音、信号或记忆',
    performance: '身体先僵住，脸部反应随后才出现',
    shotSize: 'insert shot',
    lens: '65mm detail lens',
    camera: 'locked frame with subtle vibration',
    composition: '声源物体在画面一侧，另一侧留出空白等待声音进入',
    blocking: '主体不立刻转头，先用肩颈僵硬表现听见'
  },
  {
    label: 'reaction',
    purpose: '消化这个不可能的信息',
    performance: '眼眶发紧但不崩溃；嘴角压住情绪',
    shotSize: 'tight close-up',
    lens: '75mm portrait lens',
    camera: 'slow eye-level push-in',
    composition: '眼睛位于上三分之一，背景异常光保持同方向不漂移',
    blocking: '主体只后退半步，身体仍朝向异常源'
  },
  {
    label: 'approach',
    purpose: '环境开始向主体逼近或开启',
    performance: '脚没有后退，反而停在边界线上',
    shotSize: 'low angle shot',
    lens: '32mm low perspective lens',
    camera: 'push along the floor line',
    composition: '地面线条把视线推向主体脚边，异常源从远端逼近',
    blocking: '主体脚尖不离开画面中的边界线，关键物保持可见'
  },
  {
    label: 'reveal',
    purpose: '不可能的载具、门、人物或通道显形',
    performance: '关键物在手里轻微颤动',
    shotSize: 'wide reveal shot',
    lens: '24mm reveal lens',
    camera: 'slow dolly backward',
    composition: '显形物居中，主体偏侧形成尺度对比，保留可剪接的稳定画面',
    blocking: '主体被迫后撤半步但不转身逃跑'
  },
  {
    label: 'reflection',
    purpose: '只通过倒影或剪影看到失去的人或真相',
    performance: '朝影像转头，却说不出话',
    shotSize: 'reflection close-up',
    lens: '50mm reflection lens',
    camera: 'parallel slide',
    composition: '真实主体和倒影分在左右两侧，倒影更亮但不完全露脸',
    blocking: '主体转头动作慢半拍，倒影先出现，主体随后反应'
  },
  {
    label: 'invitation',
    purpose: '门、开口或路径刚好对准主体',
    performance: '决定前低头看了一眼关键物',
    shotSize: 'symmetrical medium shot',
    lens: '40mm balanced lens',
    camera: 'locked frontal frame',
    composition: '门缝或通道严格居中，主体站在中轴线外一点点',
    blocking: '主体先看关键物，再把身体摆正面对通道'
  },
  {
    label: 'memory object',
    purpose: '发现证明旧连接真实存在的小物件',
    performance: '手伸出去，却停在触碰之前',
    shotSize: 'insert-medium hybrid',
    lens: '60mm object-memory lens',
    camera: 'slow push toward the object',
    composition: '物件占前景三分之一，主体脸部只在背景保留压低的轮廓',
    blocking: '主体手停在物件上方，直到下一镜头才做选择'
  },
  {
    label: 'threshold decision',
    purpose: '把关键物放到边界处',
    performance: '一只脚悬在留下和离开之间',
    shotSize: 'low close-up',
    lens: '35mm ground-level lens',
    camera: 'tilt from object to foot',
    composition: '关键物和鞋尖同框，边界线横切画面下方',
    blocking: '主体先放下关键物，再让脚停在边界上，不立刻迈过'
  },
  {
    label: 'answer waits',
    purpose: '失去的人或最终信号伸出邀请，但不强迫',
    performance: '邀请停在光里等待，不抓取主体',
    shotSize: 'long lens interior shot',
    lens: '100mm compressed long lens',
    camera: 'slow rack focus',
    composition: '邀请者或信号在远端光里，主体前景轮廓压暗',
    blocking: '远端只伸手或亮起，不主动靠近主体'
  },
  {
    label: 'unresolved crossing',
    purpose: '半步踏入不可能的空间',
    performance: '恐惧还在，但身体已经向前选择',
    shotSize: 'wide final frame',
    lens: '28mm final tableau lens',
    camera: 'slow pull-back',
    composition: '主体、通道、关键物形成三角构图，留下可接下一段的开放空间',
    blocking: '主体只迈半步，尾帧冻结在可继续动作的位置'
  }
]

const ENTERPRISE_DOCUMENTARY_BLUEPRINTS = [
  {
    label: 'memory hook',
    sourceNote: '童年号声',
    purpose: '建立精神母题：童年听见号声，父亲的背影把个人记忆和工厂连接起来',
    performance: '怀念但克制；目光追随父亲背影，手里攥着饭盒或工牌',
    shotSize: 'wide establishing shot',
    lens: '28mm documentary wide lens',
    camera: 'slow push from dawn factory gate to the family silhouette',
    composition: '厂区轮廓、晨雾和父亲背影形成纵深，主体站在画面下三分之一',
    blocking: '孩子停在路边仰望，父亲背影向厂区走去，号声作为动作触发'
  },
  {
    label: 'sound object',
    sourceNote: '下班号与家庭记忆',
    purpose: '把“嘟，哒嘟嘟”的下班号声转化为可见的家庭温度',
    performance: '孩子期待、父亲沉默微笑，情绪不外放',
    shotSize: 'medium close-up',
    lens: '50mm intimate lens',
    camera: 'small push-in toward hands and lunch box',
    composition: '铝饭盒、工装袖口和孩子视线同框，背景保留厂区色块',
    blocking: '父亲把饭盒递近，孩子的手先伸出又停住'
  },
  {
    label: 'first workday',
    sourceNote: '1996年入厂',
    purpose: '从童年记忆切到1996年成为东锅电焊工',
    performance: '年轻人紧张又兴奋；站姿努力挺直',
    shotSize: 'medium back shot',
    lens: '35mm natural perspective lens',
    camera: 'tracking behind the young worker into the workshop',
    composition: '车间门框压出工业尺度，焊光在远处闪烁',
    blocking: '主角从门口跨入车间，手套和焊帽在胸前压住'
  },
  {
    label: 'welding trial',
    sourceNote: '电焊高温考验',
    purpose: '呈现电焊工作的高温、汗水和身体代价',
    performance: '咬牙忍住灼热，呼吸短促但动作稳定',
    shotSize: 'low angle shot',
    lens: '32mm low perspective lens',
    camera: 'push along the steel cylinder line',
    composition: '筒体内壁形成压迫弧线，焊枪火花切开画面',
    blocking: '主角俯身进入筒体，肩背先被热浪压低'
  },
  {
    label: 'mentor correction',
    sourceNote: '师傅点题',
    purpose: '师傅把“下班号”纠正为“上班号声”，完成价值观第一次反转',
    performance: '师傅神情收住，主角愣住后慢慢看向焊花',
    shotSize: 'tight close-up',
    lens: '75mm portrait lens',
    camera: 'slow eye-level push-in',
    composition: '师傅眼神、焊光反射和主角侧脸压在同一条视线上',
    blocking: '师傅转回工位，主角停在原地半拍'
  },
  {
    label: 'father origin',
    sourceNote: '父亲讲述创业血脉',
    purpose: '父亲讲述三线内迁和创业基因，把个人疑问扩展为企业血脉',
    performance: '父亲语气沉稳，主角低头听懂分量',
    shotSize: 'reflection close-up',
    lens: '50mm reflection lens',
    camera: 'parallel slide across table, water glass, and old factory image',
    composition: '杯中水纹、父亲手掌和旧厂房记忆叠在画面层次里',
    blocking: '父亲手指点向旧照片或桌面，主角视线跟随'
  },
  {
    label: 'history montage',
    sourceNote: '东锅创业史',
    purpose: '用厂房、煤炉、荒地和工人手掌浓缩东锅创业史',
    performance: '群像沉默用力，动作整齐但不口号化',
    shotSize: 'wide environmental shot',
    lens: '24mm industrial wide lens',
    camera: 'slow lateral slide through layered factory history',
    composition: '荒地、简易住房、厂房钢架和工人群像形成时间切片',
    blocking: '群像从画面边缘推入钢材和工具，厂房轮廓逐渐占满背景'
  },
  {
    label: '2011 order',
    sourceNote: '2011年九天攻坚',
    purpose: '进入2011年燃烧器车间，九天攻坚任务压到所有人面前',
    performance: '车间主任坚定，团队从沉默到抬头',
    shotSize: 'symmetrical medium shot',
    lens: '40mm balanced lens',
    camera: 'locked frontal frame then slight push',
    composition: '任务图纸居中，团队围成半弧，工位灯形成压力线',
    blocking: '主任把图纸压在桌面，众人把车票和工具放下'
  },
  {
    label: 'problem reveal',
    sourceNote: '变形难题',
    purpose: '严重变形让装配受阻，技术难题成为视觉冲突',
    performance: '技术员皱眉压住焦虑，手指反复校准尺寸',
    shotSize: 'insert-medium hybrid',
    lens: '60mm object-process lens',
    camera: 'slow push toward warped steel and measuring tool',
    composition: '变形工件占前景三分之一，图纸和团队轮廓在后景',
    blocking: '主角蹲下测量，手指沿变形边缘停住'
  },
  {
    label: 'process breakthrough',
    sourceNote: '氩弧焊突破',
    purpose: '群策群力提出氩弧焊方案，让问题出现转机',
    performance: '讨论从紧绷转为专注，眼神亮起但仍克制',
    shotSize: 'medium close-up',
    lens: '50mm workshop lens',
    camera: 'small push-in from blueprint to welding torch',
    composition: '图纸、焊枪、手套和几双手构成决策中心',
    blocking: '一只手把新工艺路线画出，另一只手把焊枪推入画面'
  },
  {
    label: 'seven-day battle',
    sourceNote: '七昼夜鏖战',
    purpose: '七昼夜攻坚，把时间、汗水和焊花压缩为连续战斗',
    performance: '疲惫但不松劲；每个人动作越来越精准',
    shotSize: 'wide reveal shot',
    lens: '24mm reveal lens',
    camera: 'time-compressed dolly through day-night workshop rhythm',
    composition: '焊花、时钟、图纸、工位灯和人影叠成工业节奏',
    blocking: '团队轮换上前，主角在焊光中完成关键焊道'
  },
  {
    label: 'delivery dawn',
    sourceNote: '提前交付',
    purpose: '提前两天交付，使命达成时第一次真正听懂上班号声',
    performance: '主角停住，眼眶发紧但没有庆祝式夸张',
    shotSize: 'tight close-up',
    lens: '75mm portrait lens',
    camera: 'slow eye-level push-in toward sweat and dawn light',
    composition: '汗水、图纸签字和黎明车间门口形成三角关系',
    blocking: '主角放下焊枪，手掌按在图纸边缘，听见号声后抬头'
  },
  {
    label: 'next generation',
    sourceNote: '2025年儿子发问',
    purpose: '2025年儿子提问，把上班号声传到新一代',
    performance: '父亲凝视儿子，答案沉稳而有重量',
    shotSize: 'symmetrical medium shot',
    lens: '40mm balanced lens',
    camera: 'locked frontal frame with gentle push',
    composition: '父子对坐，远处智能设备光点和老工牌同框',
    blocking: '儿子发问，父亲先看工厂方向，再转回儿子'
  },
  {
    label: 'future oath',
    sourceNote: '传承与未来',
    purpose: '传承到新一代：号声成为东锅人迈向智能未来的集结战鼓',
    performance: '群像坚定向前，不喊口号，用步伐完成誓词',
    shotSize: 'wide final frame',
    lens: '28mm final tableau lens',
    camera: 'slow pull-back from workers to factory skyline',
    composition: '老厂记忆、现代产线和年轻背影同框，号声方向居中',
    blocking: '三代意象在同一方向汇合，团队走向车间深处'
  }
]

function stripSourcePrefix(sourceText) {
  return sourceText.replace(/^(小说片段|粗剧本|广告短片|广告文案|剧情|剧本)[:：]\s*/u, '').trim()
}

function splitBeats(sourceText) {
  const cleaned = stripSourcePrefix(sourceText)
  const beats = cleaned
    .split(/[。！？!?；;]\s*/u)
    .map((part) => part.trim())
    .filter(Boolean)
  return beats.length ? beats : [cleaned]
}

function enterpriseBeatLibrary(sourceText) {
  const text = stripSourcePrefix(sourceText)
  const candidates = [
    ['童年号声', /(桃花山|螃蟹沟|父亲|下班号|饭盒|童年)/u, '童年听见号声，父亲从厂区归来，声音先是家庭温度。'],
    ['1996入厂', /(1996|技校|轻容分厂|电焊工|焊枪|焊花)/u, '1996年成为东锅电焊工，第一次以自己的身体进入钢铁车间。'],
    ['师傅点题', /(师傅|于进川|上班号|下班号|劳模)/u, '师傅纠正“最好听的是上班号声”，把舒适期待转成奋斗命题。'],
    ['父亲溯源', /(三线|内迁|创业|干打垒|蜂窝煤|血脉|先辈)/u, '父亲讲述东锅创业史，说明号声背后是几代人的实干血脉。'],
    ['2011攻坚', /(2011|燃烧器|德阳|制造基地|660MW|稳燃器|九天|端午|攻坚)/u, '2011年燃烧器车间迎来九天攻坚，团队退掉端午车票迎战任务。'],
    ['工艺突破', /(变形|单面焊|氩弧焊|尺寸|过关|图纸)/u, '技术难题逼近失败边缘，团队改进工艺让变形问题得到解决。'],
    ['提前交付', /(七昼夜|提前|交付|答卷|使命|汗水)/u, '七昼夜攻坚后提前交付，主角第一次真正听懂上班号声。'],
    ['代际传承', /(2025|儿子|毕业|机械工程|智能|未来|传承|高质量|转型)/u, '2025年儿子发问，上班号声成为传给下一代的奋斗密码。']
  ]
  const selected = candidates.filter(([, pattern]) => pattern.test(text)).map(([, , beat]) => beat)
  return selected.length ? selected : splitBeats(sourceText)
}

function firstMatch(text, patterns, fallback) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1] || match[0]
  }
  return fallback
}

function firstIncluded(text, values, fallback) {
  return values.find((value) => text.includes(value)) ?? fallback
}

function inferAnchors(contract) {
  const text = stripSourcePrefix(contract.sourceText)
  const protagonist = firstMatch(text, [
    /((?:退役|前)?(?:潜水员|外卖骑手|外卖员|列车调度员|调度员|医生|记者|画家|警探|工程师|母亲|父亲)[\u4e00-\u9fa5]{1,4})(?=接|送|回|走|来到|收到|发现|站|进入|沿|看|听|推|把|伸|在|，|。|$)/u,
    /(女孩|男孩|女人|男人|母亲|父亲|老人|孩子)/u
  ], 'main subject')

  const lostFigure = firstMatch(text, [
    /(妹妹|哥哥|姐姐|弟弟|女儿|儿子|母亲|父亲|恋人|妻子|丈夫|朋友)/u,
    /(女孩影子|男孩影子|人影|影子)/u
  ], 'lost figure')

  const keyObject = firstMatch(text, [
    /(红色弹珠|弹珠|纸质车票|车票|蓝鲸|画纸|红围巾|信号灯|黑伞|照片|录音带|钥匙|戒指)/u,
    /(一张[\u4e00-\u9fa5]{1,8}|一盏[\u4e00-\u9fa5]{1,8}|一条[\u4e00-\u9fa5]{1,8})/u
  ], 'key object')

  const location = firstMatch(text, [
    /(废弃医院|护士站|废弃海洋馆|旧地铁站|废弃地铁站|站台|巷口|医院走廊|医院|旧影院|灯塔|车站|海边|隧道|水箱)/u
  ], 'liminal location')

  const impossibleSign = firstMatch(text, [
    /(不存在的13楼|13楼|电梯|绿色信号灯|鲸鱼的低鸣|鲸鱼低鸣|报站声|深海光|没有司机的银色列车|黑伞|广播)/u
  ], 'impossible signal')

  return {
    strategy: 'suspense_drama',
    protagonist,
    lostFigure,
    keyObject,
    location,
    impossibleSign,
    visualStyle: contract.target.style,
    aspectRatio: contract.target.aspectRatio
  }
}

function inferEnterpriseAnchors(contract) {
  const text = stripSourcePrefix(contract.sourceText)
  const organization = firstIncluded(text, ['东方锅炉', '东锅'], '东锅')
  const protagonist = firstMatch(text, [
    /(缪海锋|海锋)/u,
    /(我)(?=从|甫任|向|凝视|回答|终于|第一次)/u
  ], '东锅人')
  const mentor = firstMatch(text, [
    /(师傅于进川|于进川|师傅)/u
  ], '师傅')
  const familyLine = /儿子/u.test(text) ? '父亲、师傅与儿子' : '父亲与师傅'
  const keyObject = firstIncluded(text, ['上班号声', '下班号声', '号声', '焊枪', '焊花', '铝饭盒', '图纸', '工牌'], '上班号声')
  const location = firstIncluded(text, ['东方锅炉车间', '东锅车间', '德阳制造基地', '燃烧器车间', '轻容分厂', '车间', '厂房'], '东方锅炉车间')
  const storySignal = firstIncluded(text, ['焊花', '氩弧焊', '数控切割机', '焊接机器人', '数控车床', '智能未来', '钢铁森林'], '焊花与智能产线')

  return {
    strategy: 'enterprise_documentary',
    protagonist: protagonist === '我' ? '东锅人' : protagonist,
    lostFigure: familyLine,
    keyObject,
    location: organization === '东方锅炉' || organization === '东锅' ? '东方锅炉车间' : location,
    impossibleSign: storySignal,
    organization,
    mentor,
    visualStyle: contract.target.style,
    aspectRatio: contract.target.aspectRatio
  }
}

function distributeDurations(totalSeconds, count) {
  const segmentCount = Math.max(1, Math.ceil(totalSeconds / 15))
  const shotsPerSegment = Math.ceil(count / segmentCount)
  const durations = []
  let remainingShots = count
  let remainingSeconds = totalSeconds

  for (let segmentIndex = 0; segmentIndex < segmentCount && remainingShots > 0; segmentIndex += 1) {
    const shotsInSegment = Math.min(shotsPerSegment, remainingShots)
    const segmentSeconds = segmentIndex === segmentCount - 1
      ? remainingSeconds
      : Math.min(15, remainingSeconds - Math.max(0, segmentCount - segmentIndex - 1))
    const base = Math.floor(segmentSeconds / shotsInSegment)
    let remainder = segmentSeconds - base * shotsInSegment

    for (let index = 0; index < shotsInSegment; index += 1) {
      const extra = remainder > 0 ? 1 : 0
      remainder -= extra
      durations.push(Math.max(1, base + extra))
    }

    remainingShots -= shotsInSegment
    remainingSeconds -= segmentSeconds
  }

  return durations
}

function shotId(index) {
  return `S${String(index + 1).padStart(2, '0')}`
}

function visibleBeat(beats, index) {
  return beats[index % beats.length]
}

function expressionCue(performance) {
  if (/恐惧|fear|惊|僵|发紧|迟疑/u.test(performance)) return '眼神先停住，呼吸变短，手指收紧'
  if (/旧记忆|grief|伤|记忆/u.test(performance)) return '眼眶压住情绪，嘴角轻收，视线慢半拍落到关键物'
  if (/邀请|决定|选择|crossing/u.test(performance)) return '下颌收紧，视线先确认关键物，再看向通道'
  return '克制表情，眉眼和手部先于身体动作泄露情绪'
}

function secondaryMotionCue(index) {
  const cues = [
    '衣摆和肩线随停步轻微回弹，指尖有短促颤动',
    '发梢或衣角被空间气流带起，关键物轻轻晃动',
    '呼吸带动胸口微起伏，手部先紧后松',
    '脚尖停在线上，身体重心缓慢前移',
    '眼神焦点从远处异常源切回手中关键物'
  ]
  return cues[index % cues.length]
}

function selectEnterpriseBlueprints(count) {
  if (count === 7) return [0, 2, 4, 7, 9, 11, 13].map((index) => ENTERPRISE_DOCUMENTARY_BLUEPRINTS[index])
  if (count === 14) return ENTERPRISE_DOCUMENTARY_BLUEPRINTS
  return Array.from({ length: count }, (_, index) => ENTERPRISE_DOCUMENTARY_BLUEPRINTS[Math.floor(index * ENTERPRISE_DOCUMENTARY_BLUEPRINTS.length / count)])
}

function selectBlueprints(count) {
  if (count === 7) return [0, 1, 3, 6, 8, 9, 12].map((index) => SHOT_BLUEPRINTS[index])
  if (count === 14) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].map((index) => SHOT_BLUEPRINTS[index])
  return Array.from({ length: count }, (_, index) => SHOT_BLUEPRINTS[Math.floor(index * SHOT_BLUEPRINTS.length / count)])
}

function selectBlueprintsForContract(contract, count) {
  if (contract.contentType === 'enterprise_documentary') return selectEnterpriseBlueprints(count)
  return selectBlueprints(count)
}

function composeImagePrompt({ anchors, blueprint, action, index }) {
  const signalLabel = anchors.strategy === 'enterprise_documentary' ? 'story signal' : 'impossible sign'
  return [
    `${anchors.visualStyle} AI short-drama storyboard keyframe, single still image`,
    `preset lock: protagonist ${anchors.protagonist}; location ${anchors.location}; key object ${anchors.keyObject}; ${signalLabel} ${anchors.impossibleSign}`,
    `shot ${shotId(index)} visible action: ${action}`,
    `expression: ${expressionCue(blueprint.performance)}`,
    `body action: ${blueprint.blocking}`,
    `secondary animation cue frozen as a still: ${secondaryMotionCue(index)}`,
    `shot size: ${blueprint.shotSize}`,
    `lens: ${blueprint.lens}`,
    `camera language: ${blueprint.camera}`,
    `composition: ${blueprint.composition}`,
    `performance: ${blueprint.performance}`,
    `continuity anchor: same ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.location}, and ${anchors.impossibleSign}; relation to ${anchors.lostFigure} stays restrained`,
    `vertical ${anchors.aspectRatio}`,
    'no text overlay',
    'no watermark',
    'no extra characters',
    'do not turn the still prompt into a video prompt',
    `shot ${shotId(index)} ${blueprint.label}`
  ].join(', ')
}

export function composeDraftAssets(contract) {
  const anchors = contract.contentType === 'enterprise_documentary'
    ? inferEnterpriseAnchors(contract)
    : inferAnchors(contract)
  const beats = contract.contentType === 'enterprise_documentary'
    ? enterpriseBeatLibrary(contract.sourceText)
    : splitBeats(contract.sourceText)
  const count = contract.target.shotCount
  const durations = distributeDurations(contract.target.durationSeconds, count)
  const selectedBlueprints = selectBlueprintsForContract(contract, count)

  const shotlist = selectedBlueprints.map((blueprint, index) => {
    const beat = anchors.strategy === 'enterprise_documentary'
      ? blueprint.sourceNote
      : visibleBeat(beats, index)
    const action = `${blueprint.purpose}；源剧情：${beat}`
    return {
      shot_id: shotId(index),
      duration_seconds: durations[index],
      scene: anchors.location,
      subject: anchors.strategy === 'enterprise_documentary'
        ? (index < Math.floor(count * 0.8) ? anchors.protagonist : `${anchors.protagonist} and next generation`)
        : (index < Math.floor(count * 0.7) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`),
      action,
      performance_detail: blueprint.performance,
      shot_size: blueprint.shotSize,
      lens: blueprint.lens,
      camera_movement: blueprint.camera,
      composition: `${blueprint.composition}；${anchors.keyObject} 与 ${anchors.impossibleSign} 必须作为稳定视觉锚点`,
      blocking: blueprint.blocking,
      lighting: anchors.strategy === 'enterprise_documentary'
        ? `${anchors.visualStyle}; practical workshop light, welding flare, dawn factory atmosphere`
        : `${anchors.visualStyle}; motivated by the impossible sign and practical location light`,
      dialogue_or_voiceover: index === Math.floor(count / 2)
        ? (anchors.strategy === 'enterprise_documentary' ? `旁白：上班号声不是结束的提醒，而是出发的战鼓。` : `${anchors.lostFigure}的声音或信号进入场景。`)
        : '',
      image_prompt: composeImagePrompt({ anchors, blueprint, action, index }),
      continuity_from_previous: index === 0 ? 'opening shot' : `延续 ${shotId(index - 1)} 的 ${anchors.location}、${anchors.protagonist}、${anchors.keyObject} 和 ${anchors.impossibleSign}`,
      video_prompt_note: `只执行 ${shotId(index)} 的单一可见动作，不合并、不串镜；主运动：${blueprint.purpose}；二级动画：${secondaryMotionCue(index)}；焦点按人物、${anchors.keyObject}、异常信号之间转移；运镜保持 ${blueprint.camera} 和 ${blueprint.lens}`
    }
  })

  return {
    directorScript: composeDirectorScript({ contract, anchors, beats }),
    characters: composeCharacters(anchors),
    shotlist,
    storyboardBoard: composeStoryboardBoard(shotlist),
    storyboardPrompts: composeStoryboardPrompts({ anchors, shotlist }),
    referencePack: composeReferencePack({ contract, shotlist }),
    jimengPack: composeExternalPack({ platform: 'Jimeng', contract, anchors, shotlist }),
    continuityReview: composeContinuityReview({ anchors, shotlist })
  }
}

function composeDirectorScript({ contract, anchors, beats }) {
  const beatLines = beats.map((beat, index) => {
    return [
      `## Beat ${index + 1}`,
      '',
      `${beat}`,
      '',
      anchors.strategy === 'enterprise_documentary'
        ? `导演处理：让${anchors.protagonist}始终具体地站在${anchors.location}和${anchors.organization ?? '工厂'}的真实劳动场景里。围绕${anchors.keyObject}、焊花、图纸、工位灯和代际问答，把散文里的精神主题压缩成可见动作。30秒只抓精神主线，不机械铺完整原文。`
        : `导演处理：让${anchors.protagonist}始终具体地站在${anchors.location}里。围绕${anchors.keyObject}和${anchors.impossibleSign}把抽象信息变成可见动作。情绪转折必须通过呼吸、视线、手部紧张和走位读出来，不靠旁白解释。`
    ].join('\n')
  })

  return [
    '# Director script',
    '',
    '## Logline',
    '',
    anchors.strategy === 'enterprise_documentary'
      ? `${anchors.protagonist}因${anchors.keyObject}回望${anchors.organization ?? '企业'}三代人的劳动记忆，在焊花与攻坚中听懂奋斗的分量。`
      : `${anchors.protagonist}因${anchors.impossibleSign}进入${anchors.location}，一段与${anchors.lostFigure}有关的旧伤被重新打开。`,
    '',
    '## Director intent',
    '',
    anchors.strategy === 'enterprise_documentary'
      ? `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要克制真实：把企业精神落到劳动动作、工具、车间节奏和代际凝视上，不靠口号和大段旁白。`
      : `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要克制：异常现象是真实的，但表演必须落在人身上，不靠解释和大喊大叫。`,
    '',
    '## Adaptation rules',
    '',
    '- 把心理活动外化为眼神、呼吸、手部紧张、停顿、走位或对关键物的反应。',
    anchors.strategy === 'enterprise_documentary'
      ? '- 重要节点独立成镜：童年号声、入厂、师傅点题、创业溯源、攻坚难题、工艺突破、提前交付、代际传承。'
      : '- 线索、惊吓、反转和门槛选择要独立成镜，不把爆点和过渡动作混成一镜。',
    '- 每个镜头只推进一个信息或情绪变化，保持原始剧情顺序和连续性。',
    anchors.strategy === 'enterprise_documentary' ? '- 纪实散文只提炼30秒精神主线：记忆钩子、入厂、师傅点题、创业溯源、攻坚突破、代际传承。' : '',
    '',
    ...beatLines,
    '',
    '## Ending principle',
    '',
    anchors.strategy === 'enterprise_documentary'
      ? `结束在${anchors.keyObject}成为新一代出发信号的画面上。不要把全文讲完，要让30秒短片完成“听见号声 -> 投入劳动 -> 传承使命”的闭环。`
      : `结束在“门槛选择”上。不要过度解释${anchors.lostFigure}，给外部视频合成保留悬念。`
  ].join('\n')
}

function composeCharacters(anchors) {
  if (anchors.strategy === 'enterprise_documentary') {
    return [
      {
        id: 'main_subject',
        role: 'documentary protagonist',
        identity_anchor: anchors.protagonist,
        costume_anchor: `固定工装、手套、焊帽或技术员工作服，符合${anchors.visualStyle}`,
        prop_anchor: anchors.keyObject,
        performance_anchor: 'restrained pride and pressure, expressed through eye line, breath, hand tension, workshop posture, and focus on tools',
        preset_policy: `Treat first-person narration, ${anchors.protagonist}, 东锅人, and worker references as the same documentary subject unless the source clearly introduces another speaker.`,
        continuity_notes: `Keep ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.location}, welding tools, drawings, and workshop light stable across all shots.`
      },
      {
        id: 'mentor_family_line',
        role: 'mentor and generational bridge',
        identity_anchor: anchors.lostFigure,
        costume_anchor: 'father, mentor, and son may appear as distinct supporting presets only when the shot calls for them',
        prop_anchor: anchors.impossibleSign,
        performance_anchor: 'quiet transmission of values; no melodramatic speeching',
        preset_policy: `Keep ${anchors.mentor ?? '师傅'} and family roles clearly separated from ${anchors.protagonist}.`,
        continuity_notes: `Use ${anchors.lostFigure} to show the value chain: family memory, craft discipline, and next-generation handoff.`
      }
    ]
  }

  return [
    {
      id: 'main_subject',
      role: 'main subject',
      identity_anchor: anchors.protagonist,
      costume_anchor: `固定服装与外观，符合${anchors.visualStyle}`,
      prop_anchor: anchors.keyObject,
      performance_anchor: 'controlled grief or fear, expressed through breath, eye line, hand tension, and restrained posture',
      preset_policy: `Treat pronouns, family titles, and short references that point to ${anchors.protagonist} as the same preset unless the source clearly introduces another subject.`,
      continuity_notes: `Keep ${anchors.protagonist}, ${anchors.keyObject}, and the same physical silhouette stable across all shots.`
    },
    {
      id: 'lost_or_impossible_figure',
      role: 'memory, signal, or impossible invitation',
      identity_anchor: anchors.lostFigure,
      costume_anchor: 'keep partially hidden unless the source explicitly demands a reveal',
      prop_anchor: anchors.impossibleSign,
      performance_anchor: 'patient and quiet; never turns into random horror spectacle',
      preset_policy: `Use one stable preset for ${anchors.lostFigure}; reveal through voice, reflection, silhouette, object, or distant gesture before a full face reveal.`,
      continuity_notes: `Represent ${anchors.lostFigure} through voice, reflection, silhouette, object, or distant gesture before any full reveal.`
    }
  ]
}

function composeStoryboardBoard(shotlist) {
  return [
    '# Storyboard board',
    '',
    '| Shot | Image slot | Shot size | Lens | Camera | Purpose | Continuity anchor |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...shotlist.map((shot) => `| ${shot.shot_id} | \`storyboard-images/${shot.shot_id}.png\` | ${shot.shot_size} | ${shot.lens} | ${shot.camera_movement} | ${shot.action} | ${shot.continuity_from_previous} |`)
  ].join('\n')
}

function composeStoryboardPrompts({ anchors, shotlist }) {
  return [
    '# Storyboard prompts',
    '',
    'Use these as still-image generation prompts. They are not video prompts.',
    '',
    '## Reference prompts',
    '',
    `### Main subject reference`,
    `${anchors.visualStyle} character reference, ${anchors.protagonist}, consistent costume, ${anchors.keyObject}, controlled performance, vertical ${anchors.aspectRatio}, no text overlay, no watermark`,
    '',
    `### Location reference`,
    `${anchors.visualStyle} location reference, ${anchors.location}, practical light, atmospheric depth, ${anchors.impossibleSign}, vertical ${anchors.aspectRatio}, no text overlay, no watermark`,
    '',
    '## Shot prompts',
    '',
    ...shotlist.flatMap((shot) => [`### ${shot.shot_id}`, shot.image_prompt, ''])
  ].join('\n')
}

function composeReferencePack({ contract, shotlist }) {
  const visual = contract.visualReferences ?? {}
  const userReferences = [
    ...(visual.characterImages ?? []).map((path) => `- 人物参考图: ${path}`),
    ...(visual.sceneImages ?? []).map((path) => `- 场景参考图: ${path}`),
    ...(visual.styleImages ?? []).map((path) => `- 风格参考图: ${path}`)
  ]

  return [
    '# Reference pack',
    '',
    'No raster images are committed by the draft writer.',
    '',
    'User-provided visual references:',
    '',
    ...(userReferences.length ? userReferences : ['- none']),
    '',
    'Recommended generation order:',
    '',
    ...(visual.characterImages?.length ? visual.characterImages.map((path) => `- user character reference: \`${path}\` (keep unchanged)`) : ['- `storyboard-images/character-reference.png`']),
    ...(visual.sceneImages?.length ? visual.sceneImages.map((path) => `- user scene reference: \`${path}\` (keep unchanged)`) : ['- `storyboard-images/scene-reference.png`']),
    '- `storyboard-images/segment-01-start.png`',
    ...shotlist.map((shot) => `- \`storyboard-images/${shot.shot_id}.png\``),
    '- `storyboard-images/segment-01-end.png`',
    '',
    'After Codex `$imagegen` generation, record actual image filenames here.'
  ].join('\n')
}

const MAX_VIDEO_SEGMENT_SECONDS = 6
const MAX_VIDEO_SEGMENT_SHOTS = 1
const MIN_USEFUL_VIDEO_SEGMENT_SECONDS = 3

function balanceTailSegment(segments, { maxSeconds, maxShots, minSeconds = MIN_USEFUL_VIDEO_SEGMENT_SECONDS }) {
  if (segments.length < 2) return segments

  const last = segments[segments.length - 1]
  const previous = segments[segments.length - 2]

  while (segmentDuration(last) < minSeconds && previous.length > 1) {
    const candidate = previous[previous.length - 1]
    const candidateSeconds = Number(candidate.duration_seconds) || 1
    if (segmentDuration(last) + candidateSeconds > maxSeconds) break
    if (last.length + 1 > maxShots) break
    last.unshift(previous.pop())
  }

  return segments.filter((segment) => segment.length)
}

function segmentShots(shotlist, { maxSeconds = MAX_VIDEO_SEGMENT_SECONDS, maxShots = MAX_VIDEO_SEGMENT_SHOTS } = {}) {
  const segments = []
  let current = []
  let currentSeconds = 0

  for (const shot of shotlist) {
    const seconds = Number(shot.duration_seconds) || 1

    if (current.length && (currentSeconds + seconds > maxSeconds || current.length >= maxShots)) {
      segments.push(current)
      current = []
      currentSeconds = 0
    }

    current.push(shot)
    currentSeconds += seconds

    if (currentSeconds >= maxSeconds) {
      segments.push(current)
      current = []
      currentSeconds = 0
    }
  }

  if (current.length) segments.push(current)
  return balanceTailSegment(segments, { maxSeconds, maxShots })
}

function segmentDuration(segment) {
  return segment.reduce((total, shot) => total + (Number(shot.duration_seconds) || 1), 0)
}

function segmentLabel(segment) {
  const first = segment[0].shot_id
  const last = segment[segment.length - 1].shot_id
  return first === last ? first : `${first}-${last}`
}

function formatTimecode(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}

function composeVideoTimeline(segment) {
  let cursor = 0
  return segment.map((shot) => {
    const seconds = Number(shot.duration_seconds) || 1
    const start = cursor
    const end = cursor + seconds
    cursor = end
    return `- ${formatTimecode(start)}-${formatTimecode(end)} | ${shot.shot_id} | shot size: ${shot.shot_size} | camera: ${shot.camera_movement} | action: ${shot.action} | performance: ${shot.performance_detail}`
  })
}

function composeExternalPack({ platform, contract, anchors, shotlist }) {
  const segments = segmentShots(shotlist)
  return [
    `# ${platform} pack`,
    '',
    'This pack is for external video synthesis. Cine Make does not render the final video.',
    '',
    `Target: ${contract.target.durationSeconds}s ${contract.target.aspectRatio} ${contract.target.style}.`,
    `Task rule: one visible action per generation task, usually ${MIN_USEFUL_VIDEO_SEGMENT_SECONDS}-${MAX_VIDEO_SEGMENT_SECONDS}s; use the storyboard images from the user-facing package.`,
    '',
    ...segments.flatMap((segment, index) => {
      const duration = segmentDuration(segment)
      const camera = [...new Set(segment.map((shot) => shot.camera_movement))].join('; ')
      const lighting = [...new Set(segment.map((shot) => shot.lighting))].join('; ')
      return [
        `## Task ${index + 1}: ${segmentLabel(segment)} (${duration}s)`,
        '',
        `Upload references: main subject reference, location reference, start frame, and end frame for ${segment.map((shot) => shot.shot_id).join(', ')}.`,
        '',
        'Prompt:',
        '',
        '```text',
        `FORMAT: ${duration}s / ${contract.target.aspectRatio} / ${contract.target.style} / start-end anchored image-to-video task`,
        '',
        `Subject lock: preserve ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.impossibleSign}, costume, lighting, location, and screen direction. Do not invent unrelated characters.`,
        `Shot alignment: generate exactly ${segment.map((shot) => shot.shot_id).join(', ')} in order; do not skip, merge, split, or borrow story from other shots.`,
        '',
        'Timeline:',
        ...composeVideoTimeline(segment),
        '',
        `Camera language: ${camera}. Keep motion restrained and continuous.`,
        `Lighting/art direction: ${lighting}.`,
        'Negative constraints: no subtitles, no watermark, no face drift, no costume change, no random props, no jump cuts, no story outside this segment.',
        '```',
        ''
      ]
    })
  ].join('\n')
}

function composeContinuityReview({ anchors, shotlist }) {
  return [
    '# Continuity review',
    '',
    '## Clean',
    '',
    `- Main subject anchor: ${anchors.protagonist}.`,
    `- Key object anchor: ${anchors.keyObject}.`,
    `- Location anchor: ${anchors.location}.`,
    anchors.strategy === 'enterprise_documentary'
      ? `- Story signal anchor: ${anchors.impossibleSign}.`
      : `- Impossible sign anchor: ${anchors.impossibleSign}.`,
    '- Still-image prompts ask for keyframes only.',
    '- External video motion is isolated to Jimeng packs.',
    `- ${shotlist.length} storyboard images are treated as pre-production/keyframe references.`,
    '',
    '## Watch',
    '',
    '- Do not let generated images invent extra characters, readable fake text, or unrelated props.',
    anchors.strategy === 'enterprise_documentary'
      ? '- Do not turn the documentary into a suspense plot; keep the conflict in labor, craft, deadline pressure, and generational transmission.'
      : `- Keep ${anchors.lostFigure} visually restrained unless the user explicitly asks for a full reveal.`,
    `- Keep ${anchors.protagonist} identity stable across all shots.`,
    '- Codex does not render the final video; final synthesis belongs to the external video tool.'
  ].join('\n')
}
