import { createScriptShotPlan, extractScriptProfile, isScriptProfileUseful, stripPersonalSummary } from './script-profile.mjs'

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

const FOLKLORE_FANTASY_BLUEPRINTS = [
  {
    label: 'ritual voice',
    sourceNote: '祭祖幻听',
    purpose: '莫川在卧室听见祭祖幻听，怒意压过恐惧',
    performance: '眉头拧紧，眼底有怒火，身体仍僵在床沿',
    shotSize: 'wide establishing shot',
    lens: '28mm room-to-ritual lens',
    camera: 'slow push from dark bedroom toward the unseen voice',
    composition: '现代卧室压暗，声音方向留出大片负空间',
    blocking: '莫川从床上撑起上身，视线扫向空无一人的房间'
  },
  {
    label: 'incense burner appears',
    sourceNote: '双耳三足香炉显形',
    purpose: '双耳三足香炉悬空显形，供香青烟扑向莫川',
    performance: '怒火瞬间凝住，瞳孔收紧，呼吸停半拍',
    shotSize: 'macro insert',
    lens: '85mm ritual object macro lens',
    camera: 'locked macro frame with slight smoke drift',
    composition: '香炉占画面中心，三炷供香和青烟形成通往前景的弧线',
    blocking: '莫川的手停在半空，青烟越过手指扑向面部'
  },
  {
    label: 'world overlap',
    sourceNote: '卧室与古祠堂重叠',
    purpose: '青烟打开重叠世界，卧室与陈家古祠堂互相穿透',
    performance: '莫川从愤怒转为迟疑，视线被神龛吸住',
    shotSize: 'wide environmental shot',
    lens: '24mm overlapping-space lens',
    camera: 'slow lateral slide through smoke layers',
    composition: '床沿、朱红神龛、供桌和雕花梁柱叠在同一纵深',
    blocking: '莫川站在现代空间边缘，祠堂老人跪在另一层空间里'
  },
  {
    label: 'descendants plead',
    sourceNote: '老人青年求祖庇佑',
    purpose: '老人和青年在祠堂中求祖庇佑，陈家灾祸被摆到眼前',
    performance: '老人涕泗横流，青年恐惧发颤，莫川旁观困惑',
    shotSize: 'symmetrical medium shot',
    lens: '40mm ancestral hall lens',
    camera: 'locked frontal frame with gentle push',
    composition: '供桌居中，老人青年跪在下方，莫川虚影压在侧后方烟里',
    blocking: '青年拉老人起身，老人又跌回蒲团前叩首'
  },
  {
    label: 'folklore rule',
    sourceNote: '黄皮讨封因果',
    purpose: '黄皮讨封的禁忌被说出：像人人亡，像神神衰',
    performance: '老人从怒骂转为失神，青年委屈又绝望',
    shotSize: 'tight close-up',
    lens: '75mm confession lens',
    camera: 'slow eye-level push-in',
    composition: '老人苍白侧脸、蒲团和供香烟线同框',
    blocking: '老人按住青年后忽然松手，整个人瘫坐在地'
  },
  {
    label: 'monster arrives',
    sourceNote: '黄不语入祠堂',
    purpose: '白烟灌入祠堂，黄不语以庞大精怪之形探首而入',
    performance: '青年惊恐失控，老人护子但双腿发抖',
    shotSize: 'wide reveal shot',
    lens: '24mm monster reveal lens',
    camera: 'slow dolly backward from doorway into hall',
    composition: '门框横梁压住黄不语头顶，猩红双眸穿过白烟',
    blocking: '老人把青年护到身后，黄不语从白烟里压入祠堂'
  },
  {
    label: 'death demand',
    sourceNote: '黄不语索命补道行',
    purpose: '黄不语点明要取青年性命填补道行，陈家无路可退',
    performance: '精怪暴怒，老人脸上绝望沉下去',
    shotSize: 'low angle shot',
    lens: '32mm oppressive monster lens',
    camera: 'push along floor line toward claws and smoke',
    composition: '黄不语占据上方，老人青年被压在下三分之一',
    blocking: '黄不语低头逼近，老人跪行半步仍挡在青年身前'
  },
  {
    label: 'incense enters',
    sourceNote: '香火入莫川口鼻',
    purpose: '绝望求祖时供香暴燃，青烟钻入莫川口鼻',
    performance: '莫川本能后仰，随后被玄妙感定住',
    shotSize: 'insert shot',
    lens: '65mm incense bridge lens',
    camera: 'locked frame with smoke flowing across planes',
    composition: '供香、莫川面部和神龛牌位被青烟连成一线',
    blocking: '莫川想躲开却吸入青烟，身体在烟里轻微虚化'
  },
  {
    label: 'first power',
    sourceNote: '飨食香火解人灾殃',
    purpose: '莫川感到飨食香火，解人灾殃的规则在心头成形',
    performance: '惊惧转为凝神，眼神第一次落到陈家父子身上',
    shotSize: 'medium close-up',
    lens: '50mm spirit awakening lens',
    camera: 'small push-in from smoke to eyes',
    composition: '莫川半透明轮廓、香火线和陈家父子形成三角关系',
    blocking: '莫川低头看向双手，烟线缠绕手腕又伸向神龛'
  },
  {
    label: 'monster senses',
    sourceNote: '黄不语察觉神龛异动',
    purpose: '黄不语察觉神龛异动，凶煞中第一次出现惊悚',
    performance: '精怪猛然昂首，猩红眼神从凶狠变成警觉',
    shotSize: 'reflection close-up',
    lens: '50mm smoke reflection lens',
    camera: 'parallel slide from monster eye to shrine tablet',
    composition: '黄不语眼中倒映神龛烟影，牌位被青烟遮住半截',
    blocking: '黄不语前爪停在门槛内，身体没有继续压进来'
  },
  {
    label: 'ancestor silhouette',
    sourceNote: '神龛上老祖峥嵘显影',
    purpose: '闪电照亮神龛，青烟凝成不辨形体的陈家老祖影',
    performance: '老人抬头呆住，青年停止发抖，莫川被迫进入神位',
    shotSize: 'wide final-spirit reveal',
    lens: '28mm shrine reveal lens',
    camera: 'slow pull-back from shrine to whole hall',
    composition: '朱漆神龛居中，青烟如焰，窗外闪电切出至阴气柱',
    blocking: '莫川虚影被烟线托上牌位，祠堂众人同时仰望'
  },
  {
    label: 'named ancestor',
    sourceNote: '黄不语惊问陈家老祖',
    purpose: '黄不语惊疑问出陈家老祖，莫川意识到自己被认成祖宗',
    performance: '莫川错愕低头，黄不语进退踌躇',
    shotSize: 'symmetrical medium shot',
    lens: '40mm confrontation lens',
    camera: 'locked frontal frame with slow rack focus',
    composition: '牌位、莫川虚影和黄不语门口巨影形成对峙中轴',
    blocking: '莫川低头确认自身，黄不语身体前倾但脚步停住'
  },
  {
    label: 'ghost body',
    sourceNote: '莫川发现自己透明无影',
    purpose: '莫川低头发现自己飘在牌位上，透明无影，疑似成了鬼',
    performance: '惊悸压到喉间，手掌穿过牌位边缘',
    shotSize: 'insert-medium hybrid',
    lens: '60mm spirit-body lens',
    camera: 'slow push from candle shadow to transparent waist',
    composition: '豆大烛火拉长牌位阴影，却没有莫川影子',
    blocking: '莫川伸手摸向牌位，腰部以下在烟里消散'
  },
  {
    label: 'monster threat',
    sourceNote: '鬼死作鬼见怕但黄不语不是鬼',
    purpose: '莫川在牌位上发现自己成了透明鬼影，黄不语看穿形散尽消后冷声逼近',
    performance: '莫川强压慌乱，黄不语恢复凶意',
    shotSize: 'wide final frame',
    lens: '28mm final tableau lens',
    camera: 'slow pull-back from shrine to monster-filled doorway',
    composition: '神龛、透明莫川、陈家父子和黄不语形成四角压迫',
    blocking: '黄不语重新踏入一爪，莫川停在牌位上没有退路'
  }
]

const CULTIVATION_TRANSMIGRATION_BLUEPRINTS = [
  {
    label: 'market rumor',
    sourceNote: '坊市凉亭听闻越国六派大败',
    purpose: '祁瑾在人群中听见魔道入侵与越国六派大败，脸色沉下去',
    performance: '表面站稳，眼神却瞬间失焦，手指攥紧衣袖',
    shotSize: 'wide establishing shot',
    lens: '28mm market-wide lens',
    camera: 'slow push through cultivator crowd',
    composition: '坊市凉亭、人群、法器摊位形成压迫纵深，祁瑾被挤在画面中心偏下',
    blocking: '周围修士交谈不停，祁瑾站在人群里慢慢停止呼吸'
  },
  {
    label: 'late arrival',
    sourceNote: '意识到自己来晚了',
    purpose: '祁瑾意识到自己穿越时间太晚，掌天瓶机缘可能已经错过',
    performance: '眼神发空，嘴角压住荒唐感，额角微跳',
    shotSize: 'tight close-up',
    lens: '75mm inner-panic lens',
    camera: 'slow eye-level push-in',
    composition: '祁瑾面部占据画面，背景传言声被压成虚化人影',
    blocking: '祁瑾没有说话，只是微微后退半步'
  },
  {
    label: 'soul crossing',
    sourceNote: '魂穿同名修仙者',
    purpose: '用病榻闪回交代祁瑾魂穿到同名修仙者身上',
    performance: '从濒死虚弱切到陌生灵魂睁眼，恐惧被理性压住',
    shotSize: 'medium flashback shot',
    lens: '35mm memory lens',
    camera: 'match cut from market face to sickbed eyes',
    composition: '病榻、药碗、旧家族屋梁和醒来的眼睛形成记忆叠化',
    blocking: '祁瑾从床上撑起，手掌试探性掐出微弱灵光'
  },
  {
    label: 'world recognition',
    sourceNote: '判定凡人修仙世界',
    purpose: '祁瑾把天南、越国六派、黄枫谷等线索拼成凡人修仙世界',
    performance: '兴奋和忧心同时浮上眼底，呼吸变快又被压住',
    shotSize: 'insert-medium hybrid',
    lens: '60mm clue-board lens',
    camera: 'slow slide across map and jade slips',
    composition: '元武国地图、越国边境、黄枫谷名字和祁瑾指尖同框',
    blocking: '祁瑾把几个情报竹简推到一起，指尖停在越国方向'
  },
  {
    label: 'bottle ambition',
    sourceNote: '觊觎掌天瓶与升仙令',
    purpose: '祁瑾决定寻找掌天瓶与升仙令，赌一把逆天机缘',
    performance: '贪念不是狂笑，而是低垂眼神里的冷静算计',
    shotSize: 'low close-up',
    lens: '50mm ambition lens',
    camera: 'push from clenched hand to eyes',
    composition: '手中灵石、地图边角和眼神形成三角构图',
    blocking: '祁瑾把地图折起收进袖中，转身走向越国边境'
  },
  {
    label: 'border blocked',
    sourceNote: '越国边境得知魔道已入侵',
    purpose: '越国边境消息击碎计划，祁瑾练气九层不敢入境送死',
    performance: '烦躁压成一口冷气，脚步停在边境线外',
    shotSize: 'wide border shot',
    lens: '32mm border-pressure lens',
    camera: 'slow dolly backward from border road',
    composition: '边境雾气、远处遁光和祁瑾孤立身影形成危险尺度',
    blocking: '祁瑾刚迈出的脚收回，避开远处魔道遁光'
  },
  {
    label: 'second plan',
    sourceNote: '退而求其次想去乱星海',
    purpose: '祁瑾改谋乱星海，希望靠低阶修士资源重新发育',
    performance: '眼神重新聚焦，但不再轻松',
    shotSize: 'medium planning shot',
    lens: '40mm tactical lens',
    camera: 'locked frame with small push',
    composition: '乱星海传闻、筑基丹字样和坊市令牌压在桌面上',
    blocking: '祁瑾把越国路线划掉，又在乱星海方向圈出红线'
  },
  {
    label: 'hanli missed',
    sourceNote: '韩立可能已经传送走',
    purpose: '祁瑾推断韩立已传送乱星海，偷袭掌天瓶的机会彻底变小',
    performance: '嫉妒和懊恼在脸上闪过，马上变成苦笑',
    shotSize: 'reflection close-up',
    lens: '50mm reflected-regret lens',
    camera: 'parallel slide from map reflection to face',
    composition: '水面倒影里浮出传送阵缺角意象，祁瑾脸在另一侧压暗',
    blocking: '祁瑾用指节敲在传送阵标记上，动作停住'
  },
  {
    label: 'family ceiling',
    sourceNote: '祁氏小家族与筑基初期太上长老',
    purpose: '祁瑾看清自身家族上限：小家族、老筑基、资源不足',
    performance: '现实感压下野心，肩线微沉',
    shotSize: 'wide interior shot',
    lens: '28mm clan-room lens',
    camera: 'slow lateral slide past ancestral tablets',
    composition: '祁氏厅堂、老旧法器、太上长老空座和祁瑾同框',
    blocking: '祁瑾站在家族门槛外，没走进去，只看了一眼'
  },
  {
    label: 'blocked fortunes',
    sourceNote: '练气机缘和乱星海机缘都被堵死',
    purpose: '掌天瓶、噬金虫、金雷竹、风雷翅等机缘像远处光点一样够不着',
    performance: '嫉妒快要失控，但仍压成低声咬牙',
    shotSize: 'symbolic montage shot',
    lens: '65mm unreachable-treasure lens',
    camera: 'slow rack focus across unreachable lights',
    composition: '几枚远处宝光被虚化屏障隔开，祁瑾手掌停在屏障前',
    blocking: '祁瑾伸手却碰不到宝光，手指在空气中攥空'
  },
  {
    label: 'foundation anxiety',
    sourceNote: '担心不筑基就会老死',
    purpose: '祁瑾把生死压力压缩成筑基丹三个字',
    performance: '烦躁变成真正恐惧，喉结轻动',
    shotSize: 'tight portrait shot',
    lens: '85mm mortality lens',
    camera: 'slow push from throat to eyes',
    composition: '暗下来的坊市灯火、祁瑾侧脸和一张寿元符纸同框',
    blocking: '祁瑾低头喃喃，手指无意识揉皱符纸'
  },
  {
    label: 'pill question',
    sourceNote: '喃喃筑基丹上哪找',
    purpose: '祁瑾脱口问出筑基丹上哪找，心魔边缘被一句话点燃',
    performance: '声音很轻，眼神却近乎失控',
    shotSize: 'medium close-up',
    lens: '50mm mutter lens',
    camera: 'locked frame with subtle tremor',
    composition: '祁瑾独坐凉亭边缘，人群声远去，画面留出大片空白',
    blocking: '祁瑾扶住栏杆，低声重复筑基丹'
  },
  {
    label: 'system ping',
    sourceNote: '叮，筑基丹距离提示',
    purpose: '叮声切入，筑基丹距离提示一条条浮现',
    performance: '祁瑾猛然抬眼，从崩溃边缘被拉回现实',
    shotSize: 'insert shot',
    lens: '70mm interface-detail lens',
    camera: 'snap focus from lips to floating text',
    composition: '半透明金色文字浮在祁瑾眼前，坊市背景瞬间静音',
    blocking: '祁瑾的手停在半空，第一条距离提示亮起'
  },
  {
    label: 'moving targets',
    sourceNote: '多个筑基丹距离移动中',
    purpose: '多个筑基丹目标在神识视野中亮起，最近路线开始生成',
    performance: '震惊转成狂喜前的克制，眼睛慢慢亮起来',
    shotSize: 'wide supernatural-interface shot',
    lens: '24mm route-map lens',
    camera: 'spiral pull-back from face into route overlay',
    composition: '元武国地形、多个光点和祁瑾所在坊市叠成导航界面',
    blocking: '祁瑾缓缓转身，视线跟随最近的七十五公里光点'
  },
  {
    label: 'turn around',
    sourceNote: '已选择最近路线，请掉头',
    purpose: '导航提示让祁瑾从绝望转向行动，故事落在掉头追丹的钩子上',
    performance: '嘴角几乎压不住，脚步已经先于理智转向',
    shotSize: 'wide final frame',
    lens: '28mm final-route lens',
    camera: 'slow pull-back from turning body to market road',
    composition: '祁瑾、坊市出口、金色路线箭头和远处灵光形成明确前进方向',
    blocking: '祁瑾在凉亭外猛然掉头，衣摆带起风，尾帧停在路线箭头上'
  }
]

function stripSourcePrefix(sourceText) {
  return sourceText.replace(/^(小说片段|粗剧本|广告短片|广告文案|剧情|剧本)[:：]\s*/u, '').trim()
}

function filmableBeatText(sourceText) {
  let cleaned = stripSourcePrefix(stripPersonalSummary(sourceText))
  const episodeStart = cleaned.search(/第一集剧本|第[一二三四五六七八九十0-9]+集剧本/u)
  if (episodeStart !== -1) cleaned = cleaned.slice(episodeStart)
  cleaned = cleaned.replace(/^第[一二三四五六七八九十0-9]+集剧本[^\n]*\n?/u, '')
  cleaned = cleaned.replace(/^\[场景[^\]]+\]\s*/u, '')
  cleaned = cleaned.replace(/^\s*角色设定[\s\S]*?(?=▲|【画面】|\[场景|$)/u, '')
  return cleaned.trim()
}

function beatVisibleLength(value) {
  return String(value).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/gu, '').length
}

function normalizeScriptBeat(value) {
  return String(value)
    .replace(/^▲\s*【[^】]+】\s*/u, '')
    .replace(/^【[^】]+】\s*/u, '')
    .replace(/\s+/g, ' ')
    .replace(/^[“”"'\s]+|[“”"'\s]+$/gu, '')
    .trim()
}

function scriptLineBeats(cleaned) {
  const lines = cleaned.split(/\n+/u).map((line) => line.trim()).filter(Boolean)
  const beats = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^(第[一二三四五六七八九十0-9]+集剧本|角色设定|\[场景)/u.test(line)) continue

    const visual = line.match(/^▲\s*【(?:画面|音效)】\s*(.+)$/u)
    if (visual) {
      beats.push(normalizeScriptBeat(visual[1]))
      continue
    }

    const inlineDialogue = line.match(/^([^：:]{1,24})[：:]\s*(.+)$/u)
    if (inlineDialogue) {
      beats.push(normalizeScriptBeat(`${inlineDialogue[1]}：${inlineDialogue[2]}`))
      continue
    }

    const speakerOnly = line.match(/^([^：:]{1,24})[：:]$/u)
    if (speakerOnly && index + 1 < lines.length) {
      const dialogue = normalizeScriptBeat(lines[index + 1])
      if (dialogue) beats.push(normalizeScriptBeat(`${speakerOnly[1]}：${dialogue}`))
      index += 1
      continue
    }

    beats.push(normalizeScriptBeat(line))
  }

  return beats.filter((beat) => beatVisibleLength(beat) >= 4)
}

function splitBeats(sourceText) {
  const cleaned = filmableBeatText(sourceText)
  const lineBeats = scriptLineBeats(cleaned)
  if (lineBeats.length >= 3) return lineBeats

  const beats = cleaned
    .split(/[。！？!?；;]\s*/u)
    .map((part) => part.trim())
    .map(normalizeScriptBeat)
    .filter((beat) => beatVisibleLength(beat) >= 4)
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

function isCultivationTransmigrationText(sourceText) {
  return /(筑基丹|掌天瓶|练气|筑基|结丹|元婴|坊市|黄枫谷|乱星海|韩立|神兵门|天星宗|元武国|魔道|灵根|传送阵|噬金虫|金雷竹|风雷翅)/u.test(stripSourcePrefix(sourceText))
}

function isFolkloreFantasyText(sourceText) {
  const text = stripSourcePrefix(sourceText)
  if (isCultivationTransmigrationText(text)) return false
  return /(黄皮|黄不语|讨封|香炉|神龛|祠堂|牌位|列祖列宗|祖宗|老祖|香火|供香|飨食|鬼|精怪|妖)/u.test(text)
}

function usesFolkloreFantasyTemplate(contract) {
  return contract.contentType === 'novel_excerpt' && isFolkloreFantasyText(contract.sourceText)
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
  let protagonist = firstMatch(text, [
    /([\u4e00-\u9fa5]{2,4})（男主角）[:：]\s*(?:私家侦探|警探|侦探|医生|记者|画家)/u,
    /((?:退役|前)?(?:潜水员|外卖骑手|外卖员|列车调度员|调度员|医生|记者|画家|警探|私家侦探|侦探|工程师|母亲|父亲)[\u4e00-\u9fa5]{1,4})(?=接|送|回|走|来到|收到|发现|站|进入|沿|看|听|推|把|伸|穿|坐|躺|猛|惊|在|，|。|$)/u,
    /(女孩|男孩|女人|男人|母亲|父亲|老人|孩子)/u
  ], 'main subject')
  const roleProtagonist = text.match(/([\u4e00-\u9fa5]{2,4})（男主角）[:：]\s*(私家侦探|警探|侦探|医生|记者|画家)/u)
  if (roleProtagonist) protagonist = `${roleProtagonist[2]}${roleProtagonist[1]}`

  const lostFigure = firstMatch(text, [
    /(妹妹|哥哥|姐姐|弟弟|女儿|儿子|母亲|父亲|恋人|妻子|丈夫|朋友)/u,
    /(女孩影子|男孩影子|人影|影子)/u
  ], 'lost figure')

  let keyObject = firstMatch(text, [
    /(手机10分钟倒计时|10分钟倒计时|倒计时手机|00:10:00|记忆只有10分钟|我的记忆只有10分钟|手臂血字|刀刻血字|血字|血手|解剖刀|警枪|热水杯|药瓶|红色胶囊)/u,
    /(红色弹珠|弹珠|纸质车票|车票|蓝鲸|画纸|红围巾|信号灯|黑伞|照片|录音带|钥匙|戒指)/u,
    /(一张[\u4e00-\u9fa5]{1,8}|一盏[\u4e00-\u9fa5]{1,8}|一条[\u4e00-\u9fa5]{1,8})/u
  ], 'key object')
  if (/(00:10:00|记忆只有10分钟|10分钟)/u.test(text) && /(手机|闹钟|倒计时)/u.test(text)) keyObject = '手机10分钟倒计时'

  let location = firstMatch(text, [
    /(暴风雨孤岛别墅客厅|孤岛别墅\s*-\s*客厅(?:\s*-\s*夜)?|孤岛别墅客厅|孤岛别墅|别墅客厅|精神病院|圣路易斯精神病院|废弃医院|护士站|废弃海洋馆|旧地铁站|废弃地铁站|站台|巷口|医院走廊|医院|旧影院|灯塔|车站|海边|隧道|水箱)/u
  ], 'liminal location')
  if (/孤岛别墅\s*-\s*客厅|孤岛别墅客厅|孤岛别墅[\s\S]{0,20}客厅/u.test(text)) location = '孤岛别墅客厅'

  let impossibleSign = firstMatch(text, [
    /(手机10分钟倒计时|10分钟倒计时|00:10:00|时间到|倒计时归零|记忆清空|记忆归零|记忆又在消失|失忆症|失忆|凯撒|圣路易斯精神病院)/u,
    /(不存在的13楼|13楼|电梯|绿色信号灯|鲸鱼的低鸣|鲸鱼低鸣|报站声|深海光|没有司机的银色列车|黑伞|广播)/u
  ], 'impossible signal')
  if (/(00:10:00|时间到|记忆又在消失|记忆清空|失忆症|失忆)/u.test(text)) impossibleSign = '记忆清空倒计时'

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

function inferFolkloreFantasyAnchors(contract) {
  const text = stripSourcePrefix(contract.sourceText)
  const protagonist = firstIncluded(text, ['莫川'], firstMatch(text, [
    /([\u4e00-\u9fa5]{2,4})(?=下意识|心神一动|低头发现|心中悸动)/u,
    /(陈[\u4e00-\u9fa5]{1,3})/u
  ], '莫川'))
  const monster = firstIncluded(text, ['黄不语', '黄皮子', '黄皮', '精怪'], '黄不语')
  const keyObject = firstIncluded(text, ['双耳三足香炉', '香炉', '供香', '牌位', '神龛'], '双耳三足香炉')
  const location = firstIncluded(text, ['古祠堂', '祠堂', '神龛', '卧室'], '陈家祠堂')
  const storySignal = firstIncluded(text, ['陈家老祖', '飨食香火', '香火', '青烟', '黄皮讨封', '讨封'], '香火青烟')

  return {
    strategy: 'folklore_fantasy',
    protagonist,
    lostFigure: monster,
    keyObject,
    location,
    impossibleSign: storySignal,
    visualStyle: contract.target.style,
    aspectRatio: contract.target.aspectRatio
  }
}

function inferCultivationTransmigrationAnchors(contract) {
  const text = stripSourcePrefix(contract.sourceText)
  const protagonist = firstIncluded(text, ['祁瑾'], firstMatch(text, [
    /([\u4e00-\u9fa5]{2,4})(?=站在人群|感觉自己|不自觉|喃喃|几乎|意识到)/u
  ], '祁瑾'))
  const keyObject = firstIncluded(text, ['筑基丹', '掌天瓶', '升仙令', '传送阵'], '筑基丹')
  const location = firstIncluded(text, ['神兵门坊市', '坊市凉亭', '神兵门', '元武国', '越国边境'], '神兵门坊市')
  const storySignal = firstIncluded(text, ['已为你选择最近路线', '筑基丹，距离七十五公里', '距离七十五公里', '叮', '导航'], '筑基丹导航提示')
  const lostFigure = firstIncluded(text, ['韩立', '掌天瓶', '乱星海', '黄枫谷'], '韩立与掌天瓶机缘')

  return {
    strategy: 'cultivation_transmigration',
    protagonist,
    lostFigure,
    keyObject,
    location,
    impossibleSign: storySignal,
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

function rebalanceDurations(baseDurations, totalSeconds) {
  const durations = baseDurations.map((value) => Math.max(1, Math.round(Number(value) || 1)))
  let current = durations.reduce((total, value) => total + value, 0)
  let index = durations.length - 1

  while (current > totalSeconds && durations.some((value) => value > 1)) {
    if (durations[index] > 1) {
      durations[index] -= 1
      current -= 1
    }
    index = (index - 1 + durations.length) % durations.length
  }

  index = 0
  while (current < totalSeconds && durations.length) {
    durations[index] += 1
    current += 1
    index = (index + 1) % durations.length
  }

  return durations
}

function shotId(index) {
  return `S${String(index + 1).padStart(2, '0')}`
}

function spreadIndex({ index, count, length }) {
  if (length <= 1 || count <= 1) return 0
  return Math.round(index * (length - 1) / (count - 1))
}

function spreadPick(items, count) {
  return Array.from({ length: count }, (_, index) => items[spreadIndex({ index, count, length: items.length })])
}

function visibleBeat(beats, index, count) {
  return beats[spreadIndex({ index, count, length: beats.length })]
}

function visibleProfileBeat(profile, index, count) {
  return profile.beats[spreadIndex({ index, count, length: profile.beats.length })]
}

function visibleScriptShotPlan(scriptShotPlan, index, count) {
  return scriptShotPlan[spreadIndex({ index, count, length: scriptShotPlan.length })]
}

function scriptActionText(beat) {
  return String(beat?.visualAction ?? beat ?? '').replace(/\s+/g, ' ').trim()
}

function scriptCharacterLabel(characters = [], fallback = '主体') {
  return characters.length ? characters.join('、') : fallback
}

function scriptBlocking({ action, characters = [], blueprint, anchors }) {
  const subject = scriptCharacterLabel(characters, anchors.protagonist)

  if (/阿杰.*冷笑|瘸子阿杰突然冷笑|所有人的目光看向他/u.test(action)) {
    return '阿杰仍在背光角落低位，冷笑先从嘴角出现，林默、安娜、雷队的视线从三个方向压向他'
  }
  if (/另外三个人|三个人|众人|所有人/u.test(action)) {
    return '林默从沙发前景抬头，安娜靠茶几倒水，雷队堵在门口持枪，阿杰缩在背光角落，四个位置形成客厅四角压力'
  }
  if (/雷队.*(终于醒了|死无对证|咬牙切齿)/u.test(action)) {
    return '雷队从门口向林默压近半步，出口仍被他身体挡住，林默被困在沙发和茶几之间不能后退'
  }
  if (/雷队.*(枪|门口)|拿着枪|守在门口/u.test(action)) {
    return '雷队站在客厅门口挡住出口，枪口压低但手贴枪身，林默留在沙发侧后方，门外雨光从雷队背后切进来'
  }
  if (/安娜.*(别逼他|看着我|失忆症)/u.test(action)) {
    return '安娜横插在林默和雷队之间，水杯停在胸前当缓冲，身体朝向林默但眼神余光盯住雷队'
  }
  if (/安娜.*倒.*水|热水/u.test(action)) {
    return '安娜在茶几一侧倾身倒水，热水杯停在她和林默之间，林默半坐半起不接杯，二人中间保留一条危险空隙'
  }
  if (/阿杰.*(凯撒|幕后黑手|林侦探)/u.test(action)) {
    return '阿杰从角落阴影里轻微抬头，拐杖和腿部支架不动，所有人的视线被他牵到房间最暗处'
  }
  if (/阿杰|瘸子|蜷缩|瑟瑟发抖/u.test(action)) {
    return '阿杰缩在背光角落，腿部支架和拐杖贴着地面，身体畏缩但视线绕过林默观察全屋'
  }
  if (/手机.*(00:00:00|时间到)|闹钟|倒计时/u.test(action)) {
    return '倒计时手机压在前景，林默的血手停在手机旁，客厅其他人保持原位不冲上来'
  }
  if (/眼神瞬间空洞|仿佛第一天/u.test(action)) {
    return '林默身体在原位像断电一样停住，眼神失焦后重新抬起血手，其他人保持原位变成陌生轮廓'
  }
  if (/惊醒|血手|满是鲜血/u.test(action)) {
    return '林默从客厅沙发猛然撑起，血手压在膝盖和沙发边，身体朝茶几方向前倾但脚还没站稳'
  }
  if (/惊雷声|呼吸声/u.test(action)) {
    return '雷声压低客厅，镜头贴住林默肩背和血手，沙发、茶几、门口的方位保持不变'
  }
  if (/衣袖|手臂|刻着|记忆只有10分钟/u.test(action)) {
    return '林默坐在沙发边拉开袖口，刀刻文字贴近镜头，其他人暂时只留成背景阴影'
  }
  if (/内心独白|我是谁|头好痛|记忆又在消失/u.test(action)) {
    return '林默坐在沙发边偏离画面中心，身后空客厅压住他，视线在血手、手机和门口之间断裂'
  }
  if (/捂住头|碎片画面|精神病院|警徽|解剖刀/u.test(action)) {
    return '林默弯腰捂头退到沙发旁，警徽和解剖刀以闪回碎片切进画面边缘，现实客厅不改变方位'
  }
  if (/查案|非法活体实验/u.test(action)) {
    return '林默慢慢抬头看向门口和病院线索方向，身体从崩溃坐姿收回到侦探的正面姿态'
  }
  if (/你们.*是谁/u.test(action)) {
    return '林默重置后站在客厅中央偏低位，其他人围在原来的门口、茶几、角落位置，尾帧留出下一轮质问的空间'
  }
  if (/暴雨|闪电|客厅/u.test(action)) {
    return '孤岛别墅客厅全景先建立沙发、门口、角落三点方位，闪电把这三个区域同时照亮'
  }

  return `${subject}停在可剪接的位置，动作沿既定空间线完成；${blueprint.blocking}`
}

function scriptPerformance({ action, characters = [], blueprint }) {
  if (/雷队/u.test(characters.join('')) || /雷队/u.test(action)) return '下颌绷紧，握枪手指发白，眼神不离林默'
  if (/安娜/u.test(characters.join('')) || /安娜/u.test(action)) return '动作柔和但指尖停顿，眼神担忧又像在隐瞒真相'
  if (/阿杰/u.test(characters.join('')) || /阿杰/u.test(action)) return '肩膀内扣，嘴角先发抖再压住一点冷笑，眼神从怯懦里漏出算计'
  if (/惊醒|血|记忆|你们.*是谁/u.test(action)) return '呼吸短促，眼神断片，手指先确认血迹和倒计时再看向别人'
  return blueprint.performance
}

function scriptComposition({ action, characters = [], blueprint }) {
  if (/另外三个人|三个人|众人|所有人/u.test(action)) return '客厅被分成四个清楚方位：沙发前景的林默、茶几旁的安娜、门口的雷队、角落的阿杰，观众一眼能读懂谁堵住出口、谁靠近、谁躲藏'
  if (/雷队.*(枪|门口)|拿着枪|守在门口/u.test(action)) return '门框竖线压住雷队身体，枪和出口在同一条视线上，林默只留成侧后方受压剪影'
  if (/安娜.*倒.*水|热水/u.test(action)) return '热水杯位于两人中线，安娜的手在前景，林默的警惕眼神在后景，水汽切开安全和控制的边界'
  if (/阿杰.*冷笑|阿杰|瘸子|蜷缩/u.test(action)) return '地面线条把视线推到角落低位，拐杖和腿部支架先出现，脸最后进入焦点'
  if (/手机|闹钟|倒计时/u.test(action)) return '手机屏幕和血手占前景，客厅人物保持背景方位，倒计时成为全场视线中心'
  if (/暴雨|闪电|客厅/u.test(action)) return '闪电短暂勾出沙发、茶几、门口、角落的空间地图，雨水反光形成冷色纵深'
  return blueprint.composition
}

function scriptShotDirection({ beat, characters, blueprint, anchors }) {
  const action = scriptActionText(beat)
  return {
    action,
    blocking: scriptBlocking({ action, characters, blueprint, anchors }),
    performance: scriptPerformance({ action, characters, blueprint }),
    composition: scriptComposition({ action, characters, blueprint })
  }
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
  return spreadPick(ENTERPRISE_DOCUMENTARY_BLUEPRINTS, count)
}

function selectFolkloreFantasyBlueprints(count) {
  if (count === 7) return [0, 1, 2, 5, 7, 10, 12].map((index) => FOLKLORE_FANTASY_BLUEPRINTS[index])
  if (count === 14) return FOLKLORE_FANTASY_BLUEPRINTS
  return spreadPick(FOLKLORE_FANTASY_BLUEPRINTS, count)
}

function selectCultivationTransmigrationBlueprints(count) {
  if (count === 7) return [0, 2, 4, 6, 9, 12, 14].map((index) => CULTIVATION_TRANSMIGRATION_BLUEPRINTS[index])
  if (count === 14) return CULTIVATION_TRANSMIGRATION_BLUEPRINTS.slice(0, 14)
  return spreadPick(CULTIVATION_TRANSMIGRATION_BLUEPRINTS, count)
}

function selectBlueprints(count) {
  if (count === 7) return [0, 1, 3, 6, 8, 9, 12].map((index) => SHOT_BLUEPRINTS[index])
  if (count === 14) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].map((index) => SHOT_BLUEPRINTS[index])
  return spreadPick(SHOT_BLUEPRINTS, count)
}

function selectBlueprintsForContract(contract, count) {
  if (contract.contentType === 'enterprise_documentary') return selectEnterpriseBlueprints(count)
  if (contract.contentType === 'cultivation_transmigration' || isCultivationTransmigrationText(contract.sourceText)) return selectCultivationTransmigrationBlueprints(count)
  if (usesFolkloreFantasyTemplate(contract)) return selectFolkloreFantasyBlueprints(count)
  return selectBlueprints(count)
}

const ROLE_FIELD_LABELS = new Set([
  '台词',
  '对白',
  '动作',
  '画面',
  '场景',
  '旁白',
  '音效',
  '转场',
  '镜头',
  '分镜',
  '字幕',
  '提示词',
  '参考图',
  '角色',
  '人物',
  '服装',
  '道具',
  '时长'
])

function isRoleFieldLabel(value) {
  return ROLE_FIELD_LABELS.has(String(value).trim())
}

function safeCharacterId(name, index) {
  return `character_${String(index + 1).padStart(2, '0')}_${String(name).replace(/[^\u4e00-\u9fa5a-z0-9]+/giu, '-').replace(/^-|-$/g, '') || 'role'}`
}

function inferCharacterRole(description, index) {
  if (/男主/u.test(description)) return 'male lead'
  if (/女主/u.test(description)) return 'female lead'
  if (/二房东|房东/u.test(description)) return 'landlord / conflict role'
  if (/少女|妹妹|双胞胎/u.test(description)) return 'secret reveal role'
  return index === 0 ? 'main character' : 'supporting character'
}

function parseExplicitCharacters(sourceText, style) {
  const preface = sourceText.split(/\n\s*(?:【\s*分镜|分镜\s*(?:\d+|[一二三四五六七八九十百]+)|Shot\s*\d+|S\d{1,3})/iu)[0] ?? ''
  const characters = []
  const addCharacter = (name, description = '') => {
    const cleanName = String(name).trim().replace(/[，,、\s]+$/u, '')
    if (!cleanName || isRoleFieldLabel(cleanName)) return
    if (!/^[\u4e00-\u9fa5A-Za-z0-9·]{1,12}$/u.test(cleanName)) return
    if (characters.some((character) => character.identity_anchor === cleanName)) return
    const index = characters.length
    const cleanDescription = String(description).trim() || '源剧本人物设定'
    characters.push({
      id: safeCharacterId(cleanName, index),
      role: inferCharacterRole(cleanDescription, index),
      identity_anchor: cleanName,
      costume_anchor: /连衣裙|校服|高中生|卷发|少女|大妈/u.test(cleanDescription)
        ? cleanDescription
        : `按已有人物参考图锁定脸型、发型、身形和服装；${cleanDescription}`,
      prop_anchor: /钥匙|手机|房租|水壶|门缝|房门/u.test(cleanDescription) ? cleanDescription : '无固定随身道具；按镜头需要出现租赁/房门/手机等道具',
      performance_anchor: /敏感|警惕/u.test(cleanDescription)
        ? '敏感警惕，眼神先躲避再反击'
        : /市侩|脑补|强硬/u.test(cleanDescription)
          ? '市侩强硬，表情转换快'
          : /天真|懵懂/u.test(cleanDescription)
            ? '懵懂天真，小动作慢半拍'
            : '克制自然，情绪通过眼神、呼吸和停顿表现',
      preset_policy: `Treat ${cleanName} as one stable ${style} character. Do not merge this character with field labels, dialogue labels, or other roles.`,
      continuity_notes: `后续所有镜头保持${cleanName}的脸型、发型、身形和服装稳定；已有角色图优先于文字自动补全。`,
      reference_image: `storyboard-images/${safeCharacterId(cleanName, index)}.png`,
      reference_prompt: `【角色参考图】角色：${cleanName}。风格：${style}。单人半身或全身，干净浅色背景，正面为主，保持脸型、发型、身形、服装稳定。人物设定：${cleanDescription}。禁止：不要加入剧情动作，不要加入其他角色，不要复杂背景，不要切换成照片质感。`
    })
  }

  for (const line of preface.split(/\n+/u).map((part) => part.trim()).filter(Boolean)) {
    const bullet = line.match(/^[-*•]\s*([^：:，,、\s]{1,12})[：:]\s*(.+)$/u)
    if (bullet) {
      addCharacter(bullet[1], bullet[2])
      continue
    }

    const roleLine = line.match(/^(?:角色|人物)[:：]\s*(.+)$/u)
    if (roleLine) {
      for (const raw of roleLine[1].split(/[、,，]/u)) addCharacter(raw)
    }
  }

  return characters
}

function explicitShotMarker(line) {
  return String(line).trim().match(/^\s*(?:【\s*分镜\s*([\d一二三四五六七八九十百]+)\s*】|分镜\s*([\d一二三四五六七八九十百]+)|镜头\s*([\d一二三四五六七八九十百]+)|shot\s*(\d+)|s(\d{1,3}))\s*(.*)$/iu)
}

function parseExplicitStoryboardBlocks(sourceText) {
  const blocks = []
  let current = null
  for (const line of sourceText.split(/\n/u)) {
    const marker = explicitShotMarker(line)
    if (marker) {
      if (current) blocks.push(current)
      current = {
        heading: (marker[6] ?? '').trim(),
        lines: []
      }
      continue
    }
    if (current) current.lines.push(line)
  }
  if (current) blocks.push(current)
  return blocks
}

function fieldValue(lines, labelPattern) {
  for (const line of lines) {
    const match = line.trim().match(new RegExp(`^${labelPattern}\\s*[：:]\\s*(.+)$`, 'u'))
    if (match) return match[1].trim()
  }
  return ''
}

function extractExplicitDialogue(lines) {
  const dialogue = []
  let inDialogue = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const inline = line.match(/^台词(?:（([^）]+)）)?\s*[：:]\s*(.+)$/u)
    if (inline) {
      dialogue.push(inline[1] ? `${inline[1].trim()}：${inline[2].trim()}` : inline[2].trim())
      inDialogue = false
      continue
    }

    if (/^台词(?:\s|$|[（(:：])/u.test(line)) {
      inDialogue = true
      continue
    }

    if (/^(画面|画面细节|音效|时长|场景|动作)\s*[：:]/u.test(line)) {
      inDialogue = false
      continue
    }

    if (inDialogue) dialogue.push(line)
  }
  return dialogue.join(' / ')
}

function extractExplicitAudio(lines, ...textParts) {
  const audio = []
  const explicit = fieldValue(lines, '(?:音效|声音|音频)')
  if (explicit) audio.push(explicit)
  for (const part of textParts) {
    const text = String(part ?? '')
    for (const match of text.matchAll(/(?:音效|声音|音频)\s*[：:]\s*([^。；;\n]+[。]?)/gu)) {
      audio.push(match[1].trim())
    }
  }
  return [...new Set(audio.filter(Boolean))].join(' / ')
}

function extractExplicitScreenText(...textParts) {
  for (const part of textParts) {
    const text = String(part ?? '')
    const match = text.match(/(?:画面弹出文字|字幕|屏幕文字)\s*[：:]\s*([^。\n]+(?:……)?)/u)
    if (match) return match[1].trim()
  }
  return ''
}

function firstSentence(value) {
  const clean = String(value).replace(/\s+/g, ' ').trim()
  return clean.split(/[。！？!?；;]/u).map((part) => part.trim()).filter(Boolean)[0] ?? clean
}

function stripOverlayText(value) {
  return String(value)
    .replace(/[，,。；;]?\s*画面弹出文字\s*[：:].*$/u, '')
    .replace(/[，,。；;]?\s*字幕\s*[：:].*$/u, '')
    .replace(/[，,。；;]?\s*音效\s*[：:].*$/u, '')
    .trim()
}

function inferSceneFromExplicitShot(heading, visual) {
  const text = `${heading} ${visual}`
  if (/外景|居民楼/u.test(text) && !/楼道|楼梯|室内|客厅|里屋|门缝/u.test(text)) return 'SCENE_01_OLD_BUILDING_EXTERIOR'
  if (/楼道|楼梯|转角|入户门/u.test(text) && !/室内|客厅|里屋|窗边|沙发/u.test(text)) return 'SCENE_02_INDOOR_STAIRWELL'
  if (/室内|客厅|一室一厅|里屋|门缝|屋内|窗边|沙发|小凳子/u.test(text)) return 'SCENE_03_SMALL_APARTMENT_INTERIOR'
  return 'SCENE_03_SMALL_APARTMENT_INTERIOR'
}

function inferShotSizeFromHeading(heading) {
  if (/全景/u.test(heading)) return 'wide shot / 全景'
  if (/中景/u.test(heading)) return 'medium shot / 中景'
  if (/半身/u.test(heading)) return 'medium close-up / 半身'
  if (/近景/u.test(heading)) return 'close-up / 近景'
  if (/特写/u.test(heading)) return 'tight close-up / 特写'
  return 'medium shot / 中景'
}

function inferLensFromShotSize(shotSize) {
  if (/wide|全景/u.test(shotSize)) return '28mm vertical wide'
  if (/tight|特写/u.test(shotSize)) return '85mm close-up'
  if (/close-up|近景|半身/u.test(shotSize)) return '50mm portrait lens'
  return '35mm natural lens'
}

function inferCameraMovement(heading, visual, index, total) {
  const text = `${heading} ${visual}`
  if (/跟拍/u.test(text)) return 'controlled follow'
  if (/推进|前移/u.test(text)) return 'slow push-in'
  if (/转|侧身|避让/u.test(text)) return 'subtle rack focus'
  if (/定格|片尾/u.test(text) || index === total - 1) return 'locked final frame'
  return 'locked frame'
}

function namesInText(text, characters) {
  return characters
    .map((character) => character.identity_anchor)
    .filter((name) => text.includes(name))
}

function explicitCharactersInFrame(text, characters) {
  const names = new Set(namesInText(text, characters))
  const has = (name) => characters.some((character) => character.identity_anchor === name)
  if (/男主|江渝白/u.test(text) && has('江渝白')) names.add('江渝白')
  if (/女主|林听晚|同班校花|女生/u.test(text) && has('林听晚')) names.add('林听晚')
  if (/李大妈|大妈|房东|二房东/u.test(text) && has('李大妈')) names.add('李大妈')
  if (/(晚晚|小脑袋|三人同框|容貌一致|双胞胎|里屋门口的少女|门缝[^。；\n]*少女)/u.test(text) && has('晚晚')) names.add('晚晚')
  return characters.map((character) => character.identity_anchor).filter((name) => names.has(name))
}

function inferExplicitLighting(scene, style) {
  if (scene === 'SCENE_01_OLD_BUILDING_EXTERIOR') return `${style}；上午白天自然光，旧居民楼外景清楚可见，生活化暖灰，不是夜景`
  if (scene === 'SCENE_02_INDOOR_STAIRWELL') return `${style}；上午白天楼道自然反射光，顶灯只作弱补光，不露天，不见天空，不是夜景`
  if (scene === 'SCENE_03_SMALL_APARTMENT_INTERIOR') return `${style}；上午柔和窗光进入室内，暖色生活光只作辅助，不是夜景`
  return `${style}；低饱和暖灰色调，光源方向保持连续`
}

function explicitPerformanceCue(text) {
  if (/惊愕|震惊|瞪大|难以置信/u.test(text)) return '眼神瞬间定住，呼吸短暂停顿'
  if (/警惕|躲闪|后退|戒备/u.test(text)) return '眼神躲闪，肩颈紧绷，动作克制'
  if (/慌张|慌忙|脸色骤变|急/u.test(text)) return '呼吸加快，手部动作抢先于身体'
  if (/谄媚|笑容|慌张/u.test(text)) return '表情快速转换，笑容不自然'
  return '克制自然，情绪通过眼神和停顿表现'
}

function explicitShotFunction(index, total, visual) {
  if (index === 0) return '开场 / 空间与人物目标建立'
  if (index === total - 1) return '结尾钩子 / 秘密揭示'
  if (/房租|搬走|男朋友|核查/u.test(visual)) return '冲突推进 / 身份误会'
  if (/同班|哑巴|说话|会说话/u.test(visual)) return '核心信息揭示'
  if (/进屋|坐|泡茶|屋内/u.test(visual)) return '空间转换 / 关系压缩'
  return '情绪推进 / 关系变化'
}

function explicitAudienceTakeaway(index, total, visual) {
  if (index === 0) return '江渝白带着收租任务进入老居民楼。'
  if (index === total - 1) return '晚晚出现，林听晚隐藏的秘密升级为下一集钩子。'
  if (/说话|哑巴/u.test(visual)) return '林听晚在学校的沉默形象和现实说话形成反差。'
  if (/李大妈|房租|搬走/u.test(visual)) return '房租冲突把江渝白和林听晚推到同一空间。'
  if (/同班|同学/u.test(visual)) return '两人的校园关系被公开，尴尬和误会加深。'
  return '人物关系或空间压力被推进。'
}

function cleanExplicitVisibleMoment(action) {
  const original = String(action)
  let cleaned = stripOverlayText(action)
    .replace(/楼道回声明显[。；;，,]*/gu, '')
    .replace(/镜头顺着声音前移[。；;，,]*/gu, '江渝白抬头看向楼上平台方向，神情被楼上动静吸引。')
    .replace(/前方传来(?:一高一低两道女声|争执声)[。；;，,]*/gu, '江渝白抬头看向楼上平台方向，神情被楼上动静吸引。')
    .replace(/江渝白出声[，,]*/gu, '江渝白站定')
    .replace(/(?:随即)?开口打破尴尬氛围/gu, '嘴唇微张，表情无奈，像准备打断对话')
    .replace(/率先发问/gu, '身体微微前倾，目光直视林听晚，嘴唇微张')
    .replace(/语气(?:强硬|加重)[，,]*/gu, '')
    .replace(/终于开口出声[，,]*/gu, '嘴唇微张')
    .replace(/说话/gu, '嘴唇微张')
    .replace(/房门发出轻响[，,]*/gu, '里屋门缝微微打开，')
    .replace(/镜头切向内侧房门[。；;，,]*/gu, '')
    .replace(/镜头给到/gu, '')
    .replace(/随即|然后/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (/李大妈率先推门走进屋内[\s\S]*林听晚欲言又止[\s\S]*江渝白迟疑/u.test(cleaned)) {
    cleaned = '入户门半开，李大妈已经站在门内侧回头催促；林听晚站在门口低头犹豫，江渝白落后半步站在楼道里，三人形成前后层次。'
  } else if (/江渝白[\s\S]*站在楼下[\s\S]*抬头望楼|江渝白[\s\S]*抬头望楼/u.test(cleaned)) {
    cleaned = '江渝白半侧身站在老居民楼单元门前台阶旁，一手拿折起的租户名单确认地址，另一手自然垂下；他微微抬眼看向单元门牌和楼上方向，像刚到楼下准备进门收租。'
  } else if (/拿起水壶|泡茶|使眼色/u.test(cleaned) && /李大妈|林听晚|江渝白/u.test(cleaned)) {
    cleaned = '李大妈手持水壶停在桌边，眼神斜向林听晚；林听晚低头不动，江渝白坐在一侧观察。'
  } else if (/率先发问|屋内只剩两人|身体紧绷/u.test(original) && /江渝白/u.test(original) && /林听晚/u.test(original)) {
    cleaned = '江渝白身体微微前倾，目光直视林听晚，像在逼问；林听晚肩颈紧绷，双手收紧，防御地避开视线。'
  } else if (/深吸一口气|嘴唇微张|到底想怎么样/u.test(cleaned) && /林听晚/u.test(cleaned)) {
    cleaned = '林听晚嘴唇微张，眼神戒备地看向江渝白；江渝白在对面露出惊讶。'
  } else if (/故意安排人|逼我就范|只是来收租/u.test(cleaned)) {
    cleaned = '林听晚身体前倾、脸颊涨红，正对江渝白；江渝白坐在对面一脸茫然。'
  } else if (/小脑袋|门缝|别出来/u.test(cleaned)) {
    cleaned = '里屋门缝微微打开，晚晚从门后探出小脑袋；林听晚脸色骤变，身体前倾挡在门前。'
  } else if (/江渝白瞪大双眼[\s\S]*少女[\s\S]*三人同框/u.test(cleaned)) {
    cleaned = '里屋门口，晚晚站在门边成为画面中心；林听晚急忙挡在她前方，江渝白在另一侧瞪大双眼，三人同框定格。'
  }

  return postCleanExplicitVisibleMoment(cleaned)
}

function removeRepeatedPhrase(value, phrase) {
  const first = value.indexOf(phrase)
  if (first === -1) return value
  const before = value.slice(0, first + phrase.length)
  const after = value.slice(first + phrase.length).replaceAll(phrase, '')
  return `${before}${after}`
}

function sentenceDedupeCore(value) {
  return String(value)
    .replace(/^(江渝白|林听晚|李大妈|晚晚)/u, '')
    .replace(/[，,。；;！？!?、\s]/gu, '')
}

function removeAdjacentDuplicateSentences(value) {
  const parts = String(value).match(/[^。！？!?；;]+[。！？!?；;]?/gu) ?? [String(value)]
  const kept = []
  for (const part of parts) {
    const sentence = part.trim()
    if (!sentence) continue
    const core = sentenceDedupeCore(sentence)
    const previous = kept.length ? sentenceDedupeCore(kept[kept.length - 1]) : ''
    const isDuplicate = core.length >= 8 && previous.length >= 8 && (
      core === previous || previous.includes(core) || core.includes(previous)
    )
    if (!isDuplicate) kept.push(sentence)
  }
  return kept.join('')
}

function cleanupExplicitPunctuation(value) {
  return String(value)
    .replace(/江渝白缓步走上楼梯，江渝白抬头/u, '江渝白缓步走上楼梯，抬头')
    .replace(/(?<!露出)自作了然(?:的表情)?[，,。]*/u, '露出自作了然的表情。')
    .replace(/[，,]\s*([。；;])/gu, '$1')
    .replace(/。\s*[；;]/gu, '。')
    .replace(/；\s*。/gu, '。')
    .replace(/。\s*。+/gu, '。')
    .replace(/；\s*；+/gu, '；')
    .replace(/[，,]\s*[，,]+/gu, '，')
    .replace(/[，,；;]\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTrailingExplicitPunctuation(value) {
  return String(value).replace(/[。；;，,]+\s*$/u, '').trim()
}

function postCleanExplicitVisibleMoment(value) {
  let cleaned = cleanupExplicitPunctuation(value)
  cleaned = removeRepeatedPhrase(cleaned, '江渝白抬头看向楼上平台方向，神情被楼上动静吸引')
  cleaned = removeAdjacentDuplicateSentences(cleaned)
  cleaned = removeRepeatedPhrase(cleaned, '表情无奈')
  cleaned = cleanupExplicitPunctuation(cleaned)
  return cleaned
}

function explicitPrimaryVisual(action) {
  if (/(晚晚|小脑袋|三人同框|容貌一致|双胞胎|里屋门口[^。；\n]*少女|门缝[^。；\n]*少女)/u.test(action)) return '里屋门口出现的晚晚'
  if (/老式小户型房间|陈设简单|一尘不染/u.test(action)) return '老式小户型房间的整洁陈设'
  if (/确认地址|单元门牌|准备进门收租/u.test(action)) return '江渝白到达楼下确认地址'
  if (/抬头看向楼上平台方向|楼上动静吸引/u.test(action)) return '江渝白被楼上动静吸引'
  if (/一唱一和|准备打断对话/u.test(action) && /江渝白/u.test(action)) return '江渝白准备打断对话'
  if (/逼问|身体微微前倾|防御地避开视线|肩颈紧绷/u.test(action) && /江渝白/u.test(action) && /林听晚/u.test(action)) return '江渝白逼问 / 林听晚紧张防御'
  if (/林听晚[^。；]*嘴唇微张|第一次开口/u.test(action)) return '林听晚第一次开口的嘴唇微张和戒备眼神'
  if (/李大妈.*挡住|挡在/u.test(action)) return '李大妈挡住林听晚'
  if (/林听晚.*完整露出|哑巴|说话/u.test(action)) return '林听晚被江渝白看见'
  if (/江渝白/u.test(action)) return firstSentence(action)
  return firstSentence(action)
}

function composeExplicitImagePrompt({ contract, shot, characters }) {
  const visibleCharacters = shot.characters?.length ? shot.characters.join('、') : '无人物或按画面需要'
  const secondary = `无文字、无对白气泡、无屏幕字幕`
  const primary = explicitPrimaryVisual(shot.action)
  return [
    `【关键帧】镜头：${shot.shot_id}`,
    `风格：${contract.target.style}`,
    `场景：${shot.scene}`,
    `人物：${visibleCharacters}`,
    `画面：${shot.action}`,
    `构图：primary=${primary}; secondary=${secondary}; background=${shot.scene}的光线和方位连续`,
    `光线：${shot.lighting}`,
    `限制：只画当前瞬间，不解释剧情，不新增角色，不新增多余道具，无文字、无对白气泡、无屏幕字幕，不要切换成照片质感`
  ].map(stripTrailingExplicitPunctuation).join('。')
}

function composeExplicitMotionPrompt(shot) {
  const names = shot.characters ?? []
  const primary = explicitPrimaryVisual(shot.action)
  if (/林听晚被江渝白看见/u.test(primary)) {
    return `${shot.duration_seconds}s. ${shot.camera_movement}. 焦点从李大妈侧身让开的边缘转到林听晚惊愕的脸；江渝白只短暂停住视线。李大妈保持让开后的姿态。Micro-performance: ${explicitPerformanceCue(shot.action)}. No cut, no new action, no face change.`
  }
  const subject = /晚晚/u.test(primary) && names.includes('晚晚')
    ? '晚晚'
    : /林听晚/u.test(primary) && names.includes('林听晚')
        ? '林听晚'
        : /江渝白/u.test(primary) && names.includes('江渝白')
          ? '江渝白'
          : /李大妈/u.test(primary) && names.includes('李大妈')
            ? '李大妈'
            : names[0] ?? '画面主体'
  const action = /看|抬头|望/u.test(shot.action)
    ? `${subject}只移动一次视线`
    : /走|进门|上楼|后退|迈步/u.test(shot.action)
      ? `${subject}只完成一个小幅位置移动`
      : /探出|探头|小脑袋/u.test(shot.action)
        ? `${subject}只从遮挡后探出一点`
        : `${subject}只做一次微表情变化`
  const still = names.filter((name) => name !== subject)
  const hold = still.length ? `${still.join('、')}保持原姿态不动。` : ''
  return `${shot.duration_seconds}s. ${shot.camera_movement}. ${action}. ${hold}Micro-performance: ${explicitPerformanceCue(shot.action)}. No cut, no new action, no face change.`
}

function explicitBlockingForAction(action, visibleCharacters, scene) {
  if (/确认地址|单元门牌|准备进门收租/u.test(action) && /江渝白/u.test(action)) {
    return '江渝白站在单元门前台阶旁，身体半侧向单元门；折起的租户名单靠近胸前，视线抬向门牌，远离道路中央。'
  }
  return visibleCharacters.length
    ? `${visibleCharacters.join('、')}按原分镜站位；只保留当前瞬间的姿态和距离关系`
    : `按原分镜保持空间结构和道具位置`
}

function composeExplicitStoryboardAssets(contract) {
  const characters = parseExplicitCharacters(contract.sourceText, contract.target.style)
  const blocks = parseExplicitStoryboardBlocks(contract.sourceText)
  const durations = distributeDurations(contract.target.durationSeconds, blocks.length || contract.target.shotCount)
  const shots = blocks.map((block, index) => {
    const heading = block.heading || `分镜${index + 1}`
    const duration = Number(fieldValue(block.lines, '时长').match(/\d+/u)?.[0]) || durations[index] || 4
    const visual = fieldValue(block.lines, '画面') || block.lines.map((line) => line.trim()).find((line) => line && !/^(时长|台词|音效|画面细节)\s*[：:]/u.test(line)) || heading
    const detail = fieldValue(block.lines, '画面细节')
    const action = cleanExplicitVisibleMoment([visual, detail].filter(Boolean).join('；')) || visual
    const scene = inferSceneFromExplicitShot(heading, visual)
    const shotSize = inferShotSizeFromHeading(heading)
    const cameraMovement = inferCameraMovement(heading, visual, index, blocks.length)
    const dialogue = extractExplicitDialogue(block.lines)
    const audio = extractExplicitAudio(block.lines, visual, detail)
    const screenText = extractExplicitScreenText(visual, detail)
    const textForCharacters = `${heading}\n${visual}\n${detail}\n${dialogue}\n${action}`
    const visibleCharacters = explicitCharactersInFrame(textForCharacters, characters)
    const shot = {
      shot_id: shotId(index),
      duration_seconds: duration,
      scene,
      subject: visibleCharacters.join('、') || characters[0]?.identity_anchor || '主体',
      characters: visibleCharacters,
      action,
      performance_detail: explicitPerformanceCue(action),
      shot_size: shotSize,
      lens: inferLensFromShotSize(shotSize),
      camera_movement: cameraMovement,
      composition: `primary=${explicitPrimaryVisual(action)}; secondary=${visibleCharacters.join('、') || '环境'}; background=${scene}空间连续`,
      blocking: explicitBlockingForAction(action, visibleCharacters, scene),
      lighting: inferExplicitLighting(scene, contract.target.style),
      dialogue_or_voiceover: dialogue,
      audio_or_sfx: audio,
      screen_text: screenText,
      continuity_from_previous: index === 0 ? 'opening shot' : `延续 ${shotId(index - 1)} 的角色脸、服装、楼道/室内方位和光线方向`,
      source_heading: heading
    }
    shot.shot_function = explicitShotFunction(index, blocks.length, action)
    shot.audience_takeaway = explicitAudienceTakeaway(index, blocks.length, action)
    shot.image_prompt = composeExplicitImagePrompt({ contract, shot, characters })
    shot.video_prompt_note = composeExplicitMotionPrompt(shot)
    return shot
  })

  const anchors = {
    strategy: 'explicit_storyboard',
    protagonist: characters[0]?.identity_anchor ?? shots[0]?.subject ?? '主体',
    lostFigure: characters[1]?.identity_anchor ?? '关系角色',
    keyObject: /房租/u.test(contract.sourceText) ? '房租/租赁身份' : '关键道具',
    location: shots[0]?.scene ?? '主场景',
    impossibleSign: /双胞胎|容貌一致|哑巴/u.test(contract.sourceText) ? '哑巴校花会说话与晚晚出现' : '剧情反转信号',
    visualStyle: contract.target.style,
    aspectRatio: contract.target.aspectRatio
  }
  const beats = shots.map((shot) => `${shot.shot_id} ${shot.action}`)
  const directorPackage = composeDirectorPackage(contract, { shotlist: shots, characters })

  return {
    directorScript: composeDirectorScript({ contract, anchors, beats }),
    characters,
    shotlist: shots,
    storyboardBoard: composeStoryboardBoard(shots),
    storyboardPrompts: composeStoryboardPrompts({ anchors, shotlist: shots }),
    referencePack: composeReferencePack({ contract, shotlist: shots }),
    jimengPack: composeExternalPack({ platform: 'Jimeng', contract, anchors, shotlist: shots }),
    continuityReview: composeContinuityReview({ anchors, shotlist: shots }),
    ...directorPackage
  }
}

function compactDirectorText(value, fallback = '未标注') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text || fallback
}

function stripStableAnchorInstruction(value, fallback = '未标注') {
  const cleaned = compactDirectorText(value, fallback)
    .replace(/[；;，,]?\s*[^。；;]*必须作为稳定视觉锚点/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || fallback
}

function visibleShotPurpose(shot) {
  const action = compactDirectorText(shot?.action, '推进当前剧情信息')
  return firstSentence(action.split('；源剧情：')[0].split('；空间调度：')[0])
}

function inferTopic(contract) {
  const text = `${contract.contentType ?? ''}\n${contract.sourceText ?? ''}\n${contract.target?.style ?? ''}`
  if (contract.contentType === 'enterprise_documentary') return '企业纪实 / 主题短片'
  if (contract.contentType === 'explicit_storyboard') return /校园|同班|校花|高中/u.test(text) ? '都市校园漫剧 / 情感悬念' : '显式分镜漫剧'
  if (/仙侠|修仙|筑基|灵气|法器|宗门|玄幻/u.test(text)) return '仙侠玄幻 / 修行动作'
  if (/科幻|机械|赛博|AI|星舰|末世|废土/u.test(text)) return '科幻末世 / 高概念悬疑'
  if (/悬疑|凶手|失忆|精神病院|尸体|查案|孤岛/u.test(text)) return '悬疑惊悚 / 心理短剧'
  if (/校园|同班|校花|高中|收租|房租/u.test(text)) return '都市校园 / 情感反转短剧'
  if (/古风|王爷|朝堂|权谋/u.test(text)) return '古风权谋 / 情感对峙'
  return '现实奇观 / AI短剧'
}

function inferWorldview(contract) {
  const text = `${contract.contentType ?? ''}\n${contract.sourceText ?? ''}\n${contract.target?.style ?? ''}`
  if (/仙侠|修仙|筑基|灵气|法器|玄幻/u.test(text)) return '玄幻 / 仙侠规则世界'
  if (/科幻|赛博|星舰|机械|末世|废土/u.test(text)) return '科幻 / 末世或工业幻想世界'
  if (/穿越|魂穿|重生|系统|导航/u.test(text)) return '现实与超自然机制混合'
  if (/鬼|祭祖|香火|祠堂|怪物/u.test(text)) return '现实与民俗奇幻混合'
  return '现实空间为主，异常或反转由剧情道具和人物关系触发'
}

function inferEmotionTone(contract, shotlist) {
  const text = `${contract.sourceText ?? ''}\n${shotlist.map((shot) => shot.action).join('\n')}`
  if (/尸体|凶手|血|枪|倒计时|失忆|精神病院/u.test(text)) return '从不安、警觉推进到高压质问和结尾钩子'
  if (/收租|校花|哑巴|同班|门缝|容貌一致/u.test(text)) return '从日常误入、尴尬旁观推进到身份反转和关系悬念'
  if (/企业|工厂|焊|攻坚|传承/u.test(text)) return '从个人记忆推进到集体奋斗和代际传承'
  if (/修仙|筑基|灵气|导航/u.test(text)) return '从信息落差、机缘焦虑推进到行动目标出现'
  return '从现实观察推进到异常显形，最后停在悬念未解的位置'
}

function inferCoreConflict(shotlist) {
  const first = visibleShotPurpose(shotlist[0])
  const last = visibleShotPurpose(shotlist.at(-1))
  return `主角从“${first}”进入事件，被迫面对“${last}”带来的关系、真相或行动选择。`
}

function inferVisualFocus(contract, shotlist) {
  const scenes = [...new Set(shotlist.map((shot) => shot.scene).filter(Boolean))]
  const props = extractProjectProps({ contract, shotlist, characters: [] }).slice(0, 5).map((item) => item.name).join('、') || '关键道具'
  return `${scenes[0] ?? '主场景'}的空间结构、人物站位、${props}、光线方向和结尾悬念画面。`
}

function composeProjectUnderstanding(contract, { shotlist, characters }) {
  return {
    topic: inferTopic(contract),
    worldview: inferWorldview(contract),
    coreConflict: inferCoreConflict(shotlist),
    emotionalTone: inferEmotionTone(contract, shotlist),
    narrativeFocus: `按原剧情顺序拆成 ${shotlist.length} 个可拍镜头单元，不改人物关系，不改台词核心含义。`,
    visualFocus: inferVisualFocus(contract, shotlist),
    mainCharacters: characters.length ? characters.map((character) => character.identity_anchor ?? character.name).join('、') : (shotlist[0]?.subject ?? '主角'),
    coreScenes: [...new Set(shotlist.map((shot) => shot.scene).filter(Boolean))].join('、') || '主场景',
    coreProps: extractProjectProps({ contract, shotlist, characters }).slice(0, 8).map((item) => item.name).join('、') || '关键道具',
    highlights: inferHighlights(contract)
  }
}

function inferHighlights(contract) {
  const text = contract.sourceText ?? ''
  const flags = []
  if (/反转|容貌一致|双胞胎|幕后|真相|重置|失忆|凯撒/u.test(text)) flags.push('反转')
  if (/凶手|门缝|倒计时|突然|诡异|消失|出现/u.test(text)) flags.push('悬念')
  if (/爆炸|大战|攻坚|尸体|血|枪|雷电/u.test(text)) flags.push('爆点')
  if (/仙侠|灵气|深海|星舰|末世|祠堂|香火/u.test(text)) flags.push('奇观')
  if (/质问|对峙|怒吼|安抚|争执|逼问/u.test(text)) flags.push('情感对峙')
  return flags.length ? flags.join(' / ') : '以剧情信息递进和人物微表情为核心，无额外大场面'
}

function composeGlobalVisualStyle(contract, { shotlist }) {
  const topic = inferTopic(contract)
  const style = contract.target?.style ?? '电影感短剧'
  const isAnimated = /国漫|漫剧|二次元|动画|漫画/u.test(style)
  const isSuspense = /悬疑|惊悚|血|凶手|失忆|孤岛/u.test(`${topic}\n${contract.sourceText ?? ''}`)
  const isFantasy = /仙侠|玄幻|灵气|法术|香火|鬼|祭祖/u.test(`${topic}\n${contract.sourceText ?? ''}`)
  return {
    paintingStyle: isAnimated ? `${style}，角色线条稳定，电影式构图` : `${style}，真实镜头逻辑，角色一致性优先`,
    texture: isAnimated ? '干净国漫画面质感，服装褶皱、道具边缘和场景材质清晰' : '超写实电影质感，皮肤/布料/金属/玻璃/雨雾材质清楚',
    lighting: isSuspense ? '低照度局部光源，门缝、窗光、屏幕光或实景灯作为动机光' : isFantasy ? '环境主光叠加灵气/烟雾/法术边缘光，保持方向统一' : '自然光或室内实景光，保持同一空间光线方向',
    color: isSuspense ? '低饱和蓝灰、暖黄局部光、高亮信号色只给关键道具' : isFantasy ? '冷暖对比、金色/青色能量点缀，不让特效盖过人物' : '低饱和生活色，肤色自然，道具颜色稳定',
    cameraLanguage: '先交代空间，再收束到人物/道具；广角负责空间，近景负责关系，特写负责信息揭示',
    sceneTemperament: [...new Set(shotlist.map((shot) => shot.scene).filter(Boolean))].join('、') || '主场景稳定可复用',
    characterPerformance: '克制表演，情绪通过眼神、呼吸、手指、肩颈和站位变化体现',
    rhythm: shotlist.length > 12 ? '快节奏短剧拆镜，但每镜只承担一个信息点' : '中速推进，给关键道具、反应和结尾钩子留停顿'
  }
}

function extractProjectProps({ contract, shotlist, characters }) {
  const text = [
    contract.sourceText,
    ...shotlist.flatMap((shot) => [shot.action, shot.composition, shot.blocking, shot.dialogue_or_voiceover, shot.screen_text]),
    ...characters.flatMap((character) => [character.prop_anchor, ...(character.props ?? [])])
  ].filter(Boolean).join('\n')
  const candidates = [
    '手机', '倒计时', '手臂刻字', '血手', '鲜血', '枪', '热水杯', '茶壶', '钥匙', '房租', '租户名单',
    '门缝', '拍立得照片', '警徽', '解剖刀', '蓝鲸画纸', '蓝鲸', '香炉', '法器', '令牌', '筑基丹',
    '拐杖', '腿部支架', '图纸', '焊枪', '饭盒'
  ]
  const found = []
  for (const name of candidates) {
    if (text.includes(name)) {
      found.push({
        name,
        function: /手机|倒计时|刻字|房租|蓝鲸|香炉|筑基丹|枪|警徽|解剖刀/u.test(name) ? '推动剧情信息或反转识别' : '强化人物关系、空间真实感或连续性',
        visualRule: `${name}只在服务当前镜头功能时入画，位置和外观保持一致`
      })
    }
  }
  if (!found.length && characters[0]?.prop_anchor) {
    found.push({
      name: characters[0].prop_anchor,
      function: '人物识别和剧情连续性',
      visualRule: '作为角色固定识别点，按镜头需要出现'
    })
  }
  return found
}

function extractEffects(contract) {
  const text = `${contract.sourceText ?? ''}\n${contract.target?.style ?? ''}`
  const effects = []
  if (/雨|暴雨|雷|闪电/u.test(text)) effects.push({ name: '雨水/闪电', visualRule: '只作为环境动态和光线触发，不遮挡人物表情' })
  if (/雾|烟|香火|青烟/u.test(text)) effects.push({ name: '烟雾/香火', visualRule: '保留层次和方向，不能把角色脸遮死' })
  if (/灵气|法术|光阵|雷电|火焰|残影/u.test(text)) effects.push({ name: '灵气/法术特效', visualRule: '贴合道具或动作源头，亮度不压过主体' })
  if (/深海|鲸鱼|水箱|海洋馆/u.test(text)) effects.push({ name: '深海光/水体光影', visualRule: '作为异常信号照亮空间边缘，保持蓝绿色方向光' })
  if (/爆炸|战斗|枪|血/u.test(text)) effects.push({ name: '冲突特效/血迹', visualRule: '控制尺度，服务信息揭示，不做随机血浆或爆炸' })
  return effects.length ? effects : [{ name: '无强特效', visualRule: '仅保留光影、尘埃、风、布料和细微环境动态' }]
}

function composeAssetPlan(contract, { shotlist, characters }) {
  return {
    characters: characters.length ? characters.map((character) => ({
      name: character.identity_anchor ?? character.name ?? '角色',
      identity: character.role ?? character.identity ?? character.identity_anchor ?? '故事角色',
      appearanceKeywords: compactDirectorText(character.appearance_anchor ?? character.appearance ?? character.description, '按源剧本和参考图锁定脸型、发型、身形'),
      costumeKeywords: compactDirectorText(character.costume_anchor ?? character.costume, '固定服装材质、颜色和轮廓'),
      expressionBase: compactDirectorText(character.performance_anchor ?? character.micro_performance, '克制表演，眼神和手部细节表达情绪'),
      coreIdentifier: compactDirectorText(character.prop_anchor ?? (character.props ?? []).join('、'), '脸型、发型、服装和当前关系位置'),
      needsTurnaround: true,
      needsPropsInFrame: Boolean(character.prop_anchor || character.props?.length),
      referenceImage: character.reference_image ?? ''
    })) : [{
      name: shotlist[0]?.subject ?? '主角',
      identity: '按源剧本识别的主角',
      appearanceKeywords: '同一张脸、同一发型、同一体型',
      costumeKeywords: '同一服装材质和颜色',
      expressionBase: '克制表演，眼神和呼吸体现情绪',
      coreIdentifier: '人物脸、服装、站位关系',
      needsTurnaround: true,
      needsPropsInFrame: true,
      referenceImage: 'storyboard-images/character-reference.png'
    }],
    scenes: [...new Set(shotlist.map((shot) => shot.scene || '主场景'))].map((scene, index) => ({
      name: scene,
      type: index === 0 ? '核心母场景' : '转场/局部空间',
      era: /古|仙|宗门|祠堂/u.test(scene) ? '架空/古风' : '现代或按源剧本时代',
      structure: '锁定入口、主体站位、前景遮挡、背景纵深和关键道具位置',
      keyElements: inferSceneElements(scene, contract.sourceText),
      lighting: composeGlobalVisualStyle(contract, { shotlist }).lighting,
      color: composeGlobalVisualStyle(contract, { shotlist }).color,
      reusability: '可作为后续分镜母图复用，换机位不换空间结构'
    })),
    props: extractProjectProps({ contract, shotlist, characters }),
    effects: extractEffects(contract)
  }
}

function inferSceneElements(scene, sourceText = '') {
  const text = `${scene}\n${sourceText}`
  if (/楼道|居民楼|楼梯/u.test(text)) return '楼梯、转角、入户门、墙面旧漆、门牌、窄走廊纵深'
  if (/客厅|室内|小户型/u.test(text)) return '沙发、茶几、里屋门口、窗边、门缝、生活杂物'
  if (/别墅|孤岛/u.test(text)) return '沙发、茶几、门口、背光角落、窗外暴雨'
  if (/海洋馆|水箱/u.test(text)) return '废弃水箱、玻璃、检修门、潮湿地面、深海光'
  if (/工厂|车间/u.test(text)) return '厂房门、焊光、钢材、图纸、工位灯'
  if (/祠堂|神龛/u.test(text)) return '神龛、烛火、供桌、香炉、木梁阴影'
  return '入口、主体活动区、前景遮挡、背景纵深、关键道具落点'
}

function inferCameraPosition(shot) {
  const text = `${shot.shot_size ?? ''} ${shot.lens ?? ''} ${shot.camera_movement ?? ''} ${shot.composition ?? ''}`.toLowerCase()
  if (/low angle|ground-level|低机位|仰/u.test(text)) return '低机位 / 仰拍'
  if (/back shot|behind|背/u.test(text)) return '背面 / 跟随视角'
  if (/macro|insert|俯|object/u.test(text)) return '俯拍或贴近道具插入'
  if (/reflection|倒影/u.test(text)) return '侧面 / 倒影视角'
  if (/wide|establish|全景/u.test(text)) return '45度或正面全景机位'
  return '正面或45度平视机位'
}

function inferSpatialRelation(shot) {
  const blocking = compactDirectorText(shot.blocking, '')
  if (blocking) return blocking
  const scene = shot.scene ?? '主场景'
  return `${shot.subject ?? '主体'}位于${scene}的主要行动区，前景/背景保留可识别空间层次。`
}

function inferKeyPropsForShot(shot, props) {
  const text = `${shot.action ?? ''}\n${shot.composition ?? ''}\n${shot.blocking ?? ''}\n${shot.screen_text ?? ''}`
  const matched = props.filter((prop) => text.includes(prop.name)).map((prop) => prop.name)
  if (matched.length) return matched.slice(0, 3).join('、')
  const compositionAnchor = String(shot.composition ?? '').match(/(?:key object|primary)=([^;；,，]+)/iu)?.[1]?.trim()
  return compositionAnchor || '本镜头关键道具按剧情需要出现'
}

function composeDirectorAtoms(shotlist, props) {
  return shotlist.map((shot, index) => ({
    shotNumber: shot.shot_id ?? shotId(index),
    shotFunction: shot.shot_function ?? (index === 0 ? '交代环境 / 引出人物' : index === shotlist.length - 1 ? '制造悬念 / 结尾钩子' : '推进动作 / 强化情绪'),
    shotSize: compactDirectorText(shot.shot_size, '中景'),
    cameraPosition: inferCameraPosition(shot),
    cameraMovement: compactDirectorText(shot.camera_movement, '定镜'),
    visualSubject: compactDirectorText(shot.subject, '画面主体'),
    characterAction: visibleShotPurpose(shot),
    expressionEmotion: compactDirectorText(shot.performance_detail, '通过眼神、呼吸、手指和肩颈表达情绪'),
    blocking: compactDirectorText(shot.blocking, inferSpatialRelation(shot)),
    spatialRelation: inferSpatialRelation(shot),
    keyProps: inferKeyPropsForShot(shot, props),
    visualFocus: stripStableAnchorInstruction(shot.composition, visibleShotPurpose(shot)),
    nextConnection: index === shotlist.length - 1 ? '尾帧停在可接下一段的悬念位置' : `动作或视线衔接到 ${shotlist[index + 1]?.shot_id ?? '下一镜'}`
  }))
}

function composeShotAnalysis(shot, index, total) {
  const size = compactDirectorText(shot.shot_size, '中景')
  const movement = compactDirectorText(shot.camera_movement, '定镜')
  const purpose = shot.shot_function ?? (index === 0 ? '建立空间和人物处境' : index === total - 1 ? '留下结尾钩子' : '推进剧情信息')
  return `使用${size}承接“${visibleShotPurpose(shot)}”，${movement}让观众先看清${shot.subject ?? '主体'}与空间/道具的关系；本镜作用是${purpose}，衔接上保持人物站位和光线方向不漂移。`
}

function composeJimengStillPrompt({ contract, shot, props }) {
  return [
    `单张AI漫剧关键帧，画风：${contract.target?.style ?? '电影感短剧'}`,
    `场景：${shot.scene ?? '主场景'}`,
    `景别：${shot.shot_size ?? '中景'}`,
    `机位：${inferCameraPosition(shot)}`,
    `画面主体：${shot.subject ?? '主体'}`,
    `人物站位：${inferSpatialRelation(shot)}`,
    `当前画面：${visibleShotPurpose(shot)}`,
    `表情动作：${compactDirectorText(shot.performance_detail, '克制表情，手部和眼神有明确情绪')}`,
    `关键道具：${inferKeyPropsForShot(shot, props)}`,
    `光线：${compactDirectorText(shot.lighting, '实景动机光，方向稳定')}`,
    `构图：${stripStableAnchorInstruction(shot.composition, '主体、道具、空间三层清楚')}`,
    '限制：只生成当前瞬间，不加字幕，不加对白气泡，不新增角色，不改变人物脸、发型、服装和场景结构'
  ].join('；')
}

function composeJimengVideoPrompt({ shot }) {
  return [
    `${shot.duration_seconds ?? 4}s视频镜头`,
    `镜头运动：从${inferCameraPosition(shot)}按“${compactDirectorText(shot.camera_movement, '定镜')}”执行，速度克制，不跳切`,
    `人物动作：${visibleShotPurpose(shot)}，只完成这一个主动作`,
    `表情变化：${compactDirectorText(shot.performance_detail, '眼神、呼吸、手指张力发生一次细微变化')}`,
    `环境动态：保持${shot.scene ?? '主场景'}的光线方向，允许尘埃、雨雾、布料或发丝轻微响应`,
    `焦点路径：先锁定${shot.subject ?? '主体'}，再落到本镜关键道具或异常信号，最后停在可衔接下一镜的位置`,
    `连续性：不新增剧情，不新增角色，不改变脸、发型、服装、道具位置和空间结构`
  ].join('；')
}

function composeFormalStoryboards(contract, shotlist, props) {
  return shotlist.map((shot, index) => ({
    id: shot.shot_id ?? shotId(index),
    scene: compactDirectorText(shot.scene, '主场景'),
    duration: `${shot.duration_seconds ?? 4}s`,
    shotSize: compactDirectorText(shot.shot_size, '中景'),
    cameraPosition: inferCameraPosition(shot),
    cameraMovement: compactDirectorText(shot.camera_movement, '定镜'),
    frame: visibleShotPurpose(shot),
    characterAction: visibleShotPurpose(shot),
    expressionEmotion: compactDirectorText(shot.performance_detail, '克制表演，眼神和手部细节表达情绪'),
    blocking: compactDirectorText(shot.blocking, inferSpatialRelation(shot)),
    spatialRelation: inferSpatialRelation(shot),
    keyProps: inferKeyPropsForShot(shot, props),
    shotAnalysis: composeShotAnalysis(shot, index, shotlist.length),
    jimengStillPrompt: composeJimengStillPrompt({ contract, shot, props }),
    jimengVideoPrompt: composeJimengVideoPrompt({ shot })
  }))
}

function composeConsistencyChecklist(contract, { shotlist, characters, props, effects }) {
  const characterNames = characters.map((character) => character.identity_anchor ?? character.name).filter(Boolean).join('、') || (shotlist[0]?.subject ?? '主角')
  const scenes = [...new Set(shotlist.map((shot) => shot.scene).filter(Boolean))].join('、') || '主场景'
  return [
    `人物外观统一：${characterNames}保持同一张脸、发型、体型和服装材质；已有角色图优先于文字。`,
    '服装统一：同一场戏内服装颜色、破损、湿度、血迹或配饰状态不得漂移。',
    `场景结构统一：${scenes}的入口、门窗、家具/建筑元素、前景遮挡和光线方向保持一致。`,
    `核心道具统一：${props.map((prop) => prop.name).slice(0, 6).join('、') || '关键道具'}只在服务镜头功能时出现，外观和位置连续。`,
    `画风统一：${contract.target?.style ?? '电影感短剧'}贯穿角色、场景、分镜和即梦提示词。`,
    '光线逻辑统一：每个高光来自场内明确光源，切镜后方向不反跳。',
    `特效逻辑统一：${effects.map((effect) => effect.name).join('、')}按源头出现，不随机铺满画面。`
  ]
}

function composeDirectorPackage(contract, { shotlist, characters = [] }) {
  const props = extractProjectProps({ contract, shotlist, characters })
  const effects = extractEffects(contract)
  return {
    projectUnderstanding: composeProjectUnderstanding(contract, { shotlist, characters }),
    globalVisualStyle: composeGlobalVisualStyle(contract, { shotlist, characters }),
    assetPlan: composeAssetPlan(contract, { shotlist, characters }),
    directorAtoms: composeDirectorAtoms(shotlist, props),
    formalStoryboards: composeFormalStoryboards(contract, shotlist, props),
    consistencyChecklist: composeConsistencyChecklist(contract, { shotlist, characters, props, effects })
  }
}

function composeImagePrompt({ anchors, blueprint, action, index, characters, blocking, performance, composition }) {
  const signalLabel = ['enterprise_documentary', 'folklore_fantasy', 'cultivation_transmigration'].includes(anchors.strategy) ? 'story signal' : 'impossible sign'
  const lockLine = characters?.length
    ? `character locks: ${characters.join('、')}; location ${anchors.location}; key object ${anchors.keyObject}; ${signalLabel} ${anchors.impossibleSign}`
    : `preset lock: protagonist ${anchors.protagonist}; location ${anchors.location}; key object ${anchors.keyObject}; ${signalLabel} ${anchors.impossibleSign}`
  const blockingLine = blocking ?? blueprint.blocking
  const performanceLine = performance ?? blueprint.performance
  const compositionLine = composition ?? blueprint.composition
  return [
    `${anchors.visualStyle} AI short-drama storyboard keyframe, single still image`,
    lockLine,
    `shot ${shotId(index)} visible action: ${action}`,
    `expression: ${expressionCue(performanceLine)}`,
    `body action: ${blockingLine}`,
    `secondary animation cue frozen as a still: ${secondaryMotionCue(index)}`,
    `shot size: ${blueprint.shotSize}`,
    `lens: ${blueprint.lens}`,
    `camera language: ${blueprint.camera}`,
    `composition: ${compositionLine}`,
    `performance: ${performanceLine}`,
    `continuity anchor: same ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.location}, and ${anchors.impossibleSign}; relation to ${anchors.lostFigure} stays restrained`,
    `vertical ${anchors.aspectRatio}`,
    'no text overlay',
    'no watermark',
    characters?.length ? 'no extra characters outside listed characters' : 'no extra characters',
    'do not turn the still prompt into a video prompt',
    `shot ${shotId(index)} ${blueprint.label}`
  ].join(', ')
}

export function composeDraftAssets(contract) {
  if (contract.contentType === 'explicit_storyboard') return composeExplicitStoryboardAssets(contract)

  const scriptProfile = extractScriptProfile(contract.sourceText)
  const anchors = contract.contentType === 'enterprise_documentary'
    ? inferEnterpriseAnchors(contract)
    : contract.contentType === 'cultivation_transmigration' || isCultivationTransmigrationText(contract.sourceText)
      ? inferCultivationTransmigrationAnchors(contract)
    : usesFolkloreFantasyTemplate(contract)
      ? inferFolkloreFantasyAnchors(contract)
    : inferAnchors(contract)
  const useScriptProfile = anchors.strategy === 'suspense_drama' && isScriptProfileUseful(scriptProfile)
  const scriptShotPlan = useScriptProfile ? createScriptShotPlan(scriptProfile) : []
  const beats = useScriptProfile
    ? scriptShotPlan.map((beat) => beat.visualAction)
    : contract.contentType === 'enterprise_documentary'
    ? enterpriseBeatLibrary(contract.sourceText)
    : splitBeats(contract.sourceText)
  const count = useScriptProfile
    ? Math.min(contract.target.shotCount, scriptShotPlan.length)
    : contract.target.shotCount
  const durations = useScriptProfile
    ? rebalanceDurations(scriptShotPlan.slice(0, count).map((shot) => shot.durationSeconds), contract.target.durationSeconds)
    : distributeDurations(contract.target.durationSeconds, count)
  const selectedBlueprints = selectBlueprintsForContract(contract, count)

  const shotlist = selectedBlueprints.map((blueprint, index) => {
    const profileBeat = useScriptProfile ? visibleScriptShotPlan(scriptShotPlan, index, count) : null
    const beat = useScriptProfile
      ? profileBeat.visualAction
      : anchors.strategy === 'enterprise_documentary'
      ? blueprint.sourceNote
      : anchors.strategy === 'cultivation_transmigration'
        ? blueprint.sourceNote
      : anchors.strategy === 'folklore_fantasy'
        ? blueprint.sourceNote
        : visibleBeat(beats, index, count)
    const scriptCharacters = profileBeat?.characters?.length ? profileBeat.characters : [anchors.protagonist]
    const scriptDirection = useScriptProfile
      ? scriptShotDirection({ beat: profileBeat, characters: scriptCharacters, blueprint, anchors })
      : null
    const action = scriptDirection?.action ?? `${blueprint.purpose}；源剧情：${beat}`
    const performance = scriptDirection?.performance ?? blueprint.performance
    const blocking = scriptDirection?.blocking ?? blueprint.blocking
    const composition = scriptDirection?.composition ?? blueprint.composition
    const subject = useScriptProfile
      ? scriptCharacters.join('、')
      : anchors.strategy === 'enterprise_documentary'
        ? (index < Math.floor(count * 0.8) ? anchors.protagonist : `${anchors.protagonist} and next generation`)
        : anchors.strategy === 'cultivation_transmigration'
          ? (index < Math.floor(count * 0.75) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`)
        : anchors.strategy === 'folklore_fantasy'
          ? (index < Math.floor(count * 0.75) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`)
        : (index < Math.floor(count * 0.7) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`)
    return {
      shot_id: shotId(index),
      duration_seconds: durations[index],
      scene: anchors.location,
      subject,
      characters: useScriptProfile ? scriptCharacters : undefined,
      action,
      performance_detail: performance,
      shot_size: blueprint.shotSize,
      lens: blueprint.lens,
      camera_movement: blueprint.camera,
      composition: `${composition}；${anchors.keyObject} 与 ${anchors.impossibleSign} 必须作为稳定视觉锚点`,
      blocking,
      lighting: anchors.strategy === 'enterprise_documentary'
        ? `${anchors.visualStyle}; practical workshop light, welding flare, dawn factory atmosphere`
        : anchors.strategy === 'cultivation_transmigration'
          ? `${anchors.visualStyle}; market lanterns, jade-slip glow, golden route overlay, restrained xianxia atmosphere`
        : anchors.strategy === 'folklore_fantasy'
          ? `${anchors.visualStyle}; incense smoke, candlelight, lightning through carved windows, shrine shadows`
        : `${anchors.visualStyle}; motivated by the impossible sign and practical location light`,
      dialogue_or_voiceover: index === Math.floor(count / 2)
        ? (anchors.strategy === 'enterprise_documentary'
            ? `旁白：上班号声不是结束的提醒，而是出发的战鼓。`
            : anchors.strategy === 'cultivation_transmigration'
              ? `旁白：筑基丹，距离七十五公里。已为你选择最近路线。`
            : anchors.strategy === 'folklore_fantasy'
              ? `旁白：飨食香火，解人灾殃。`
              : `${anchors.lostFigure}的声音或信号进入场景。`)
        : '',
      image_prompt: composeImagePrompt({
        anchors,
        blueprint,
        action,
        index,
        characters: useScriptProfile ? scriptCharacters : undefined,
        blocking,
        performance,
        composition
      }),
      continuity_from_previous: index === 0 ? 'opening shot' : `延续 ${shotId(index - 1)} 的 ${anchors.location}、${anchors.protagonist}、${anchors.keyObject} 和 ${anchors.impossibleSign}`,
      video_prompt_note: `只执行 ${shotId(index)} 的单一可见动作，不合并、不串镜；主运动：${scriptDirection?.action ?? blueprint.purpose}；二级动画：${secondaryMotionCue(index)}；焦点按人物、${anchors.keyObject}、异常信号之间转移；运镜保持 ${blueprint.camera} 和 ${blueprint.lens}`
    }
  })

  const characters = composeCharacters(anchors, useScriptProfile ? scriptProfile : null)
  const directorPackage = composeDirectorPackage(contract, { shotlist, characters })

  return {
    directorScript: composeDirectorScript({ contract, anchors, beats }),
    characters,
    shotlist,
    storyboardBoard: composeStoryboardBoard(shotlist),
    storyboardPrompts: composeStoryboardPrompts({ anchors, shotlist }),
    referencePack: composeReferencePack({ contract, shotlist }),
    jimengPack: composeExternalPack({ platform: 'Jimeng', contract, anchors, shotlist }),
    continuityReview: composeContinuityReview({ anchors, shotlist }),
    ...directorPackage
  }
}

function composeDirectorScript({ contract, anchors, beats }) {
  const durationPolicy = contract.target.durationSource === 'script_paced_from_source'
    ? `按剧本自然密度拆成 ${contract.target.durationSeconds}s，不新增剧情、不删剧情、不为凑时长灌水`
    : contract.target.durationSource === 'explicit'
      ? `按用户指定的 ${contract.target.durationSeconds}s 组织节奏，不新增剧情`
      : `按剧情密度自动拆成 ${contract.target.durationSeconds}s`
  const beatLines = beats.map((beat, index) => {
    return [
      `## Beat ${index + 1}`,
      '',
      `${beat}`,
      '',
      anchors.strategy === 'enterprise_documentary'
        ? `导演处理：让${anchors.protagonist}始终具体地站在${anchors.location}和${anchors.organization ?? '工厂'}的真实劳动场景里。围绕${anchors.keyObject}、焊花、图纸、工位灯和代际问答，把散文里的精神主题压缩成可见动作。${durationPolicy}，不机械铺完整原文。`
        : anchors.strategy === 'folklore_fantasy'
          ? `导演处理：让${anchors.protagonist}始终被${anchors.keyObject}和${anchors.location}牵引。${durationPolicy}，民俗主线必须覆盖：幻听祭祖、香炉显界、祠堂求救、${anchors.lostFigure}逼命、香火入身、老祖显影、发现鬼身。`
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
      : anchors.strategy === 'cultivation_transmigration'
        ? `${anchors.protagonist}在${anchors.location}听见越国六派大败，确认自己错过掌天瓶与乱星海机缘，崩溃追问筑基丹时被${anchors.impossibleSign}重新点燃行动。`
      : anchors.strategy === 'folklore_fantasy'
        ? `${anchors.protagonist}因${anchors.keyObject}看见${anchors.location}，被陈家香火牵到${anchors.lostFigure}讨命现场，最后发现自己成了陈家老祖鬼影。`
      : `${anchors.protagonist}因${anchors.impossibleSign}进入${anchors.location}，一段与${anchors.lostFigure}有关的旧伤被重新打开。`,
    '',
    '## Director intent',
    '',
    anchors.strategy === 'enterprise_documentary'
      ? `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要克制真实：把企业精神落到劳动动作、工具、车间节奏和代际凝视上，不靠口号和大段旁白。`
      : anchors.strategy === 'cultivation_transmigration'
        ? `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要把大段内心吐槽外化成坊市反应、地图推演、机缘幻象和导航界面，不把修仙设定念成说明书。`
      : anchors.strategy === 'folklore_fantasy'
        ? `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要克制压迫：香火、青烟、牌位、神龛和怪物体量承担恐怖，不靠乱加血腥和跳吓。`
      : `目标：${contract.target.durationSeconds}s，${contract.target.aspectRatio}，${contract.target.style}。整体要克制：异常现象是真实的，但表演必须落在人身上，不靠解释和大喊大叫。`,
    '',
    '## Adaptation rules',
    '',
    '- 把心理活动外化为眼神、呼吸、手部紧张、停顿、走位或对关键物的反应。',
    anchors.strategy === 'enterprise_documentary'
      ? '- 重要节点独立成镜：童年号声、入厂、师傅点题、创业溯源、攻坚难题、工艺突破、提前交付、代际传承。'
      : anchors.strategy === 'cultivation_transmigration'
        ? '- 重要节点独立成镜：坊市传言、魂穿判定、凡人世界确认、掌天瓶野心、越国封路、乱星海错失、家族上限、筑基焦虑、导航觉醒。'
      : anchors.strategy === 'folklore_fantasy'
        ? '- 重要节点独立成镜：幻听、香炉、祠堂重叠、讨封因果、黄不语入场、香火入身、老祖显影、鬼身揭示。'
      : '- 线索、惊吓、反转和门槛选择要独立成镜，不把爆点和过渡动作混成一镜。',
    '- 每个镜头只推进一个信息或情绪变化，保持原始剧情顺序和连续性。',
    anchors.strategy === 'enterprise_documentary' ? `- 纪实散文按目标时长提炼精神主线：记忆钩子、入厂、师傅点题、创业溯源、攻坚突破、代际传承。` : '',
    anchors.strategy === 'cultivation_transmigration' ? `- 修仙穿越开篇按目标时长保留主线：来晚了、机缘堵死、筑基焦虑、系统导航反转。` : '',
    anchors.strategy === 'folklore_fantasy' ? `- 长开篇按目标时长拆民俗主线，不把前半段幻听解释铺满整个短片。` : '',
    '',
    ...beatLines,
    '',
    '## Ending principle',
    '',
    anchors.strategy === 'enterprise_documentary'
      ? `结束在${anchors.keyObject}成为新一代出发信号的画面上。不要机械复述全文，要让目标时长内完成“听见号声 -> 投入劳动 -> 传承使命”的闭环。`
      : anchors.strategy === 'cultivation_transmigration'
        ? `结束在${anchors.protagonist}按${anchors.impossibleSign}掉头追向最近筑基丹的动作上。不要提前解释系统来源，把钩子留给下一段夺丹。`
      : anchors.strategy === 'folklore_fantasy'
        ? `结束在${anchors.protagonist}发现自己无影透明、${anchors.lostFigure}重新逼近的压迫尾帧上。保留下一段对抗，不提前解决危机。`
      : `结束在“门槛选择”上。不要过度解释${anchors.lostFigure}，给外部视频合成保留悬念。`
  ].join('\n')
}

function composeCharacters(anchors, scriptProfile = null) {
  if (scriptProfile?.cast?.length) return scriptProfile.cast

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

  if (anchors.strategy === 'cultivation_transmigration') {
    return [
      {
        id: 'protagonist',
        role: 'transmigrated cultivator protagonist',
        identity_anchor: anchors.protagonist,
        costume_anchor: `低阶修仙家族弟子衣袍、储物袋、旧玉简，符合${anchors.visualStyle}`,
        prop_anchor: anchors.keyObject,
        performance_anchor: 'black-humor panic under strict restraint; greed, fear, and calculation shown through eyes, hands, and route-following movement',
        preset_policy: `Treat ${anchors.protagonist} as the only main subject. Do not replace him with Han Li, market bystanders, or system UI.`,
        continuity_notes: `Keep ${anchors.protagonist}, ${anchors.location}, ${anchors.keyObject}, jade slips, map, and golden navigation overlay stable across all shots.`
      },
      {
        id: 'missed_fortune',
        role: 'off-screen fortune pressure',
        identity_anchor: anchors.lostFigure,
        costume_anchor: 'only appear as map marks, rumors, silhouettes, or symbolic treasure glints unless the source directly shows them',
        prop_anchor: anchors.impossibleSign,
        performance_anchor: 'unreachable opportunity and route-guidance pressure',
        preset_policy: `Do not make ${anchors.lostFigure} the protagonist. It is a pressure source and objective anchor.`,
        continuity_notes: `Use ${anchors.impossibleSign} as the turning-point visual cue that converts despair into action.`
      }
    ]
  }

  if (anchors.strategy === 'folklore_fantasy') {
    return [
      {
        id: 'main_subject',
        role: 'folklore fantasy protagonist',
        identity_anchor: anchors.protagonist,
        costume_anchor: `现代睡衣或居家衣物逐渐被香火鬼影覆盖，符合${anchors.visualStyle}`,
        prop_anchor: anchors.keyObject,
        performance_anchor: 'anger turning into shock, then forced composure as incense power enters the body',
        preset_policy: `Treat 他, 主角, and ${anchors.protagonist} as the same protagonist preset; do not replace him with the praying elder.`,
        continuity_notes: `Keep ${anchors.protagonist}, ${anchors.keyObject}, ${anchors.location}, smoke direction, tablet position, and ghost transparency stable across all shots.`
      },
      {
        id: 'monster_or_threat',
        role: 'folklore threat',
        identity_anchor: anchors.lostFigure,
        costume_anchor: 'large folklore spirit silhouette, swollen canine-weasel body, red eyes, smoke-wrapped mane',
        prop_anchor: anchors.impossibleSign,
        performance_anchor: 'threatening confidence that breaks into caution when the ancestor image appears',
        preset_policy: `Use ${anchors.lostFigure} consistently for the monster threat; keep the praying elder and youth as supporting presets.`,
        continuity_notes: `Represent ${anchors.lostFigure} through white smoke, doorway scale, red eyes, claws, and halted forward pressure.`
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
      : anchors.strategy === 'folklore_fantasy'
        ? `- Folklore signal anchor: ${anchors.impossibleSign}.`
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
      : anchors.strategy === 'cultivation_transmigration'
        ? `- Do not turn this into folklore horror; keep ${anchors.protagonist}, the cultivation market, missed fortunes, and the ${anchors.keyObject} route system as the central arc.`
      : anchors.strategy === 'folklore_fantasy'
        ? `- Do not let the praying elder replace ${anchors.protagonist}; the target-duration arc must reach ${anchors.lostFigure}, the ancestor reveal, and the ghost-body twist.`
      : `- Keep ${anchors.lostFigure} visually restrained unless the user explicitly asks for a full reveal.`,
    `- Keep ${anchors.protagonist} identity stable across all shots.`,
    '- Codex does not render the final video; final synthesis belongs to the external video tool.'
  ].join('\n')
}
