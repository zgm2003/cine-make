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

function isCultivationTransmigrationText(sourceText) {
  return /(筑基丹|掌天瓶|练气|筑基|结丹|元婴|坊市|黄枫谷|乱星海|韩立|神兵门|天星宗|元武国|魔道|灵根|传送阵|噬金虫|金雷竹|风雷翅)/u.test(stripSourcePrefix(sourceText))
}

function isFolkloreFantasyText(sourceText) {
  const text = stripSourcePrefix(sourceText)
  if (isCultivationTransmigrationText(text)) return false
  return /(黄皮|黄不语|讨封|香炉|神龛|祠堂|牌位|列祖列宗|祖宗|老祖|香火|供香|飨食|鬼|精怪|妖)/u.test(text)
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

function selectFolkloreFantasyBlueprints(count) {
  if (count === 7) return [0, 1, 2, 5, 7, 10, 12].map((index) => FOLKLORE_FANTASY_BLUEPRINTS[index])
  if (count === 14) return FOLKLORE_FANTASY_BLUEPRINTS
  return Array.from({ length: count }, (_, index) => FOLKLORE_FANTASY_BLUEPRINTS[Math.floor(index * FOLKLORE_FANTASY_BLUEPRINTS.length / count)])
}

function selectCultivationTransmigrationBlueprints(count) {
  if (count === 7) return [0, 2, 4, 6, 9, 12, 14].map((index) => CULTIVATION_TRANSMIGRATION_BLUEPRINTS[index])
  if (count === 14) return CULTIVATION_TRANSMIGRATION_BLUEPRINTS.slice(0, 14)
  return Array.from({ length: count }, (_, index) => CULTIVATION_TRANSMIGRATION_BLUEPRINTS[Math.floor(index * CULTIVATION_TRANSMIGRATION_BLUEPRINTS.length / count)])
}

function selectBlueprints(count) {
  if (count === 7) return [0, 1, 3, 6, 8, 9, 12].map((index) => SHOT_BLUEPRINTS[index])
  if (count === 14) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].map((index) => SHOT_BLUEPRINTS[index])
  return Array.from({ length: count }, (_, index) => SHOT_BLUEPRINTS[Math.floor(index * SHOT_BLUEPRINTS.length / count)])
}

function selectBlueprintsForContract(contract, count) {
  if (contract.contentType === 'enterprise_documentary') return selectEnterpriseBlueprints(count)
  if (contract.contentType === 'cultivation_transmigration' || isCultivationTransmigrationText(contract.sourceText)) return selectCultivationTransmigrationBlueprints(count)
  if (isFolkloreFantasyText(contract.sourceText)) return selectFolkloreFantasyBlueprints(count)
  return selectBlueprints(count)
}

function composeImagePrompt({ anchors, blueprint, action, index }) {
  const signalLabel = ['enterprise_documentary', 'folklore_fantasy', 'cultivation_transmigration'].includes(anchors.strategy) ? 'story signal' : 'impossible sign'
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
    : contract.contentType === 'cultivation_transmigration' || isCultivationTransmigrationText(contract.sourceText)
      ? inferCultivationTransmigrationAnchors(contract)
    : isFolkloreFantasyText(contract.sourceText)
      ? inferFolkloreFantasyAnchors(contract)
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
      : anchors.strategy === 'cultivation_transmigration'
        ? blueprint.sourceNote
      : anchors.strategy === 'folklore_fantasy'
        ? blueprint.sourceNote
      : visibleBeat(beats, index)
    const action = `${blueprint.purpose}；源剧情：${beat}`
    return {
      shot_id: shotId(index),
      duration_seconds: durations[index],
      scene: anchors.location,
      subject: anchors.strategy === 'enterprise_documentary'
        ? (index < Math.floor(count * 0.8) ? anchors.protagonist : `${anchors.protagonist} and next generation`)
        : anchors.strategy === 'cultivation_transmigration'
          ? (index < Math.floor(count * 0.75) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`)
        : anchors.strategy === 'folklore_fantasy'
          ? (index < Math.floor(count * 0.75) ? anchors.protagonist : `${anchors.protagonist} and ${anchors.lostFigure}`)
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
  const durationPolicy = contract.target.durationSource === 'explicit'
    ? `按用户指定的 ${contract.target.durationSeconds}s 取舍剧情`
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
