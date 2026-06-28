import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'
import { composeSeedanceAllReferenceFeedMarkdown } from '../src/seedance-reference-feed-writer.mjs'

const source = [
  '第1章 神级文娱系统',
  '鬼王宗宗门大殿内，白发黑袍的林夜坐在宗主石椅上。魔门八宗汇报屠杀正道弟子，林夜表面冷淡，内心害怕正魔大战暴露卧底身份。',
  '系统提示：神级文娱系统绑定成功。商城出现抖音纯享版和天机一型手机。',
  '林夜发现抖音没有任何视频，于是自拍15秒发布，确认不是网络问题，而是没人发内容。',
  '林夜想到用娱乐拖住正魔两道修士的修炼和厮杀，一次买下一万部手机，骑幽冥虎王前往姹女教。',
  '姹女教教主白清玄误会林夜来双修。林夜分发手机，教女修打开抖音、拍摄、发布、加音乐特效。',
  '林夜制定抖音使用规则，禁止乱拍泄露宗门隐私，要求每人每天至少上传5条作品，并画出旗袍、JK和高跟鞋设计图。'
].join('\n')

test('抖音仙界开局 Seedance feed uses dedicated 3D guoman opening profile', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: source,
    style: '3D国漫，国风仙侠，轻喜剧反差，古风写实材质',
    aspectRatio: '16:9',
    targetSeconds: 15,
    expandScript: false
  })
  const markdown = composeSeedanceAllReferenceFeedMarkdown(pack)

  assert.equal(pack.title, '抖音仙界开局')
  assert.equal(pack.videoLines.length, 45)
  assert.deepEqual(pack.assets.filter((asset) => asset.kind === 'image').map((asset) => asset.title), [
    '鬼王宗宗门大殿',
    '鬼王宗大殿外石阶',
    '姹女教山门',
    '姹女教宗门大殿',
    '林夜',
    '白清玄',
    '幽冥虎王',
    '天机一型手机',
    '抖音教学玉简',
    '旗袍JK高跟鞋设计图'
  ])
  assert.match(markdown, /### 第1组｜第1-5条/)
  assert.match(markdown, /### 第2组｜第6-10条/)
  assert.match(markdown, /### 第9组｜第41-45条/)
  assert.match(markdown, /林夜（内心OS，压低）：正魔大战一开，第一个死的就是我/)
  assert.match(markdown, /系统提示：神级文娱系统绑定成功/)
  assert.match(markdown, /白清玄（娇笑）：宗主哥哥，是想双修了？/)
  assert.match(markdown, /林夜：每日五条，先从换装开始/)
  assert.match(markdown, /旗袍、JK和高跟鞋设计图/)
  assert.match(markdown, /上传参考图：鬼王宗宗门大殿 = 图片1；林夜 = 图片5/)
  assert.match(markdown, /上传参考图：鬼王宗宗门大殿 = 图片1；鬼王宗大殿外石阶 = 图片2；林夜 = 图片5；幽冥虎王 = 图片7；天机一型手机 = 图片8/)
  assert.match(markdown, /上传参考图：鬼王宗大殿外石阶 = 图片2；姹女教山门 = 图片3；林夜 = 图片5；白清玄 = 图片6；幽冥虎王 = 图片7/)
  assert.match(markdown, /抖音教学玉简 = 图片9/)
  assert.match(markdown, /旗袍JK高跟鞋设计图 = 图片10/)
  assert.match(markdown, /成年成熟女修/)
  assert.match(markdown, /内衬、里裙、安全短裤或不透明下摆/)
  assert.doesNotMatch(markdown, /storyboard-images|首帧|尾帧|S01|segment/)
  assert.equal(pack.speechBudget.warnings.length, 0)
})
