import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'
import { composeSeedanceAllReferenceFeedMarkdown } from '../src/seedance-reference-feed-writer.mjs'

const style = '3D国漫，国风仙侠，轻喜剧反差，仙门庄严感与现代短视频界面冲击结合'

const chapter1Source = [
  '第1章 神级文娱系统',
  '鬼王宗宗门大殿内，白发黑袍的林夜坐在宗主石椅上。',
  '骨灵教枯瘦老者汇报：正道奸细已剥皮抽筋，骨头炼成法器，皮囊明日丢到烈阳宗。',
  '血刀门壮汉汇报屠了清风观三代弟子，抽了雷灵根天才的灵根。',
  '黑纱女子汇报小倩等人污了浩然书院弟子的文心。',
  '鬼财神汇报天剑门联合正道十大宗门攻陷十座灵石矿脉，放走十万矿奴，杀死三百多名鬼王宗弟子。',
  '魔门众人请战，林夜表面冷淡，谎称魔功到了最后阶段，暂缓正魔开战。',
  '众人退下后，林夜独自在大殿里害怕正魔大战暴露卧底身份。',
  '系统提示：神级文娱系统绑定成功。商城出现抖音纯享版和天机一型手机。',
  '林夜用一块灵石购买天机一型手机，屏幕亮起音符图标。'
].join('\n')

const chapter2Source = [
  '第2章 抖音，招募女主播',
  '林夜点开抖音，发现一条视频也没有，确认不是没网络，而是这个世界只有他一个人有手机。',
  '他自拍15秒并发布，主页终于刷到自己的视频。',
  '林夜想到用娱乐拖住正魔两道修士的修炼和厮杀，于是一次买下一万部手机。',
  '他走出鬼王宗大殿，骑上幽冥虎王前往姹女教。',
  '姹女教山门，白清玄带女修迎接，问林夜是不是专程来找她。',
  '白清玄误会林夜要双修，林夜说今天来办关乎魔门存亡的重要事情。',
  '林夜让白清玄召集能歌善舞的弟子，在姹女教宗门大殿分发手机。',
  '白清玄接过手机疑惑，林夜说这是手机，待会亲自教她们使用。'
].join('\n')

const chapter3Source = [
  '第3章 旗袍，JK',
  '林夜在姹女教宗门大殿把手机一一分发下去。',
  '女修们疑惑，林夜举起手机教学开机，打开抖音，再点击下面的十字进入拍摄模式。',
  '女修们看到屏幕里会动的画面，全都惊奇。',
  '林夜对准白清玄拍摄15秒视频并发布，众人返回主页刷到了这段视频。',
  '林夜继续教配乐、特效、文字、美颜和账号规则，提醒不能乱拍乱传泄露宗门隐私。',
  '白清玄给林夜连发几百条可爱表情，林夜警告再发就拉黑她。',
  '林夜写出抖音教学玉简并复制分发。',
  '他布置任务：每个人每天不少于5条作品，可以歌曲演奏、舞蹈表演，也可以换装。',
  '白清玄问何为换装，林夜让人拿纸笔，画出旗袍、JK和高跟鞋设计图。'
].join('\n')

const forbiddenMeta = /storyboard-images|首帧|尾帧|S\d{2}|segment|keyframe/u

test('抖音仙界第1章 feed stays in chapter 1 and does not preload later chapter assets', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: chapter1Source,
    style,
    aspectRatio: '16:9',
    targetSeconds: 15,
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.equal(pack.title, '抖音仙界第1章｜神级文娱系统')
  assert.equal(pack.feedFileName, 'seedance-all-reference-feed-01.md')
  assert.equal(pack.videoLines.length, 25)
  assert.deepEqual(pack.assets.filter((asset) => asset.kind === 'image').map((asset) => asset.title), [
    '鬼王宗宗门大殿',
    '林夜',
    '神级文娱系统界面',
    '天机一型手机'
  ])
  assert.match(markdown, /骨灵教老者：正道奸细已炼成法器，皮囊明日丢去烈阳宗。/)
  assert.match(markdown, /血刀门壮汉：屠了清风观三代弟子。/)
  assert.match(markdown, /骨灵教老者音色=骨灵教枯瘦老者\.mp3/u)
  assert.match(markdown, /血刀门壮汉音色=血刀门光头壮汉\.mp3/u)
  assert.match(markdown, /系统提示：神级文娱系统绑定成功。/)
  assert.match(markdown, /天机一型手机/)
  assert.doesNotMatch(markdown, /白清玄|姹女教|幽冥虎王|旗袍|JK|高跟鞋|抖音教学玉简/u)
  assert.doesNotMatch(markdown, forbiddenMeta)
})

test('抖音仙界第2章 feed covers phone validation and recruiting without chapter 3 design props', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: chapter2Source,
    style,
    aspectRatio: '16:9',
    targetSeconds: 15,
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.equal(pack.title, '抖音仙界第2章｜抖音，招募女主播')
  assert.equal(pack.feedFileName, 'seedance-all-reference-feed-02.md')
  assert.equal(pack.videoLines.length, 25)
  assert.deepEqual(pack.assets.filter((asset) => asset.kind === 'image').map((asset) => asset.title), [
    '鬼王宗宗门大殿',
    '鬼王宗大殿外石阶',
    '姹女教山门',
    '姹女教宗门大殿',
    '林夜',
    '白清玄',
    '幽冥虎王',
    '天机一型手机'
  ])
  assert.match(markdown, /林夜：不是没网，是没人发。/)
  assert.match(markdown, /林夜：走，去姹女教。/)
  assert.match(markdown, /白清玄：宗主哥哥，是专程来找奴家的吗？/)
  assert.match(markdown, /林夜：这是手机，本座亲自教你们用。/)
  assert.match(markdown, /林夜音色=林夜\.mp3/u)
  assert.match(markdown, /白清玄音色=白清玄\.mp3/u)
  assert.doesNotMatch(markdown, /青年男声|成年女性/u)
  assert.doesNotMatch(pack.videoLines.join('\n'), /旗袍|JK|高跟鞋|抖音教学玉简|每日五条|拉黑/u)
  assert.doesNotMatch(markdown, /### 图片\d+ = 旗袍JK高跟鞋设计图|### 图片\d+ = 抖音教学玉简/u)
  assert.doesNotMatch(markdown, forbiddenMeta)
})

test('抖音仙界第3章 feed starts at training and ends on costume design hook', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: chapter3Source,
    style,
    aspectRatio: '16:9',
    targetSeconds: 15,
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.equal(pack.title, '抖音仙界第3章｜旗袍，JK')
  assert.equal(pack.feedFileName, 'seedance-all-reference-feed-03.md')
  assert.equal(pack.videoLines.length, 25)
  assert.deepEqual(pack.assets.filter((asset) => asset.kind === 'image').map((asset) => asset.title), [
    '姹女教宗门大殿',
    '林夜',
    '白清玄',
    '姹女教女修群像',
    '天机一型手机',
    '抖音教学玉简',
    '旗袍JK高跟鞋设计图'
  ])
  assert.match(pack.videoLines[0], /^日 内 姹女教宗门大殿 /u)
  assert.match(markdown, /女修：画面还会动！/)
  assert.match(markdown, /白清玄：拉黑是什么意思？/)
  assert.match(markdown, /林夜：每人每日不少于五条作品。/)
  assert.match(markdown, /旗袍、JK和高跟鞋设计图/)
  assert.match(markdown, /林夜音色=林夜\.mp3/u)
  assert.match(markdown, /白清玄音色=白清玄\.mp3/u)
  assert.doesNotMatch(markdown, /青年男声|成年女性|女修音色=/u)
  assert.doesNotMatch(markdown, /鬼王宗宗门大殿|骨灵教|血刀门|幽冥虎王|走，去姹女教/u)
  assert.doesNotMatch(markdown, forbiddenMeta)
})

test('抖音仙界 profile rejects multi-chapter source so chapters are exported as separate feeds', () => {
  assert.throws(() => buildSeedanceReferenceFeedPackage({
    sourceText: [chapter1Source, chapter2Source, chapter3Source].join('\n'),
    style,
    aspectRatio: '16:9',
    targetSeconds: 15,
    expandScript: false
  }), /抖音仙界内容跨多个章节，请按章节分别生成 Seedance feed/u)
})
