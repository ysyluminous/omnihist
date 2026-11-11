# omnihist

**涓€涓懡浠わ紝鎶婁綘鎵€鏈?AI 宸ュ叿鐨勫璇濇敹杩涘悓涓€涓彲鎼滅储鐨勬湰鍦板簱銆?*

Claude Code銆丆odex銆乷pencode銆乄orkBuddy銆丵oder銆丱penMausBot銆丟emini CLI銆丱penClaw銆丆line銆丆opilot Chat鈥︹€?瀹冧滑鍚勮嚜鎶婂巻鍙茶棌鍦ㄤ笉鍚岀殑鏂囦欢澶广€丼QLite 鍜?JSONL 閲岋紝浜掔浉鐪嬩笉瑙併€俹mnihist 鍙杩欎簺鏂囦欢锛?缁熶竴鎴愪竴濂?`浼氳瘽 鈫?娑堟伅`锛屽瓨杩涗竴涓?SQLite 鏂囦欢锛屽啀閫氳繃鍛戒护琛屽拰 MCP 浜よ繕缁欎换浣?AI銆?
```
~/.claude/projects/*.jsonl      鈹?~/.workbuddy/projects/*.jsonl   鈹?opencode.db / main.sqlite       鈹溾攢鈹€鈻? ~/.omnihist/omnihist.db  鈹€鈹€鈻? omnihist search
~/.openmausbot/messages.db      鈹?       锛圫QLite + FTS5锛?         omnihist mcp
ChatGPT / Claude 瀵煎嚭 JSON      鈹?                                  浠绘剰 agent 鍙洖
```

涓嶆崲宸ュ叿锛屼笉鏀瑰伐鍏凤紝涓嶄笂浼犮€備綘鐨勫巻鍙茶繕鏄綘鐨勩€?
---

## 涓轰粈涔堝仛杩欎釜

浣犵幇鍦ㄨ嚦灏戞湁鍥涗釜 AI 鍦ㄥ悓鏃跺共娲汇€傛瘡涓兘璁板緱鑷繁閭ｄ竴鎽婏紝鍒殑閮戒笉鐭ラ亾銆?
- **鎵句竴涓棫缁撹**锛氬彧璁板緱"涓婂懆璺熸煇涓?AI 鑱婅繃缂撳瓨閿€庝箞瀹?锛屼絾蹇樹簡鏄摢涓伐鍏枫€佸摢涓」鐩€?- **鎹㈠伐鍏峰氨澶卞繂**锛氬湪 Codex 閲岃皟閫氱殑涓滆タ锛屾崲鍒?Claude Code 瑕侀噸鏂拌В閲婁竴閬嶃€?- **宸ュ叿浼氳嚜宸卞垹鍘嗗彶**锛欳laude Code 榛樿 30 澶╂竻涓€娆★紝閲嶈涓€娆′篃鍙兘娓呯┖銆?- **鎹㈢數鑴戝氨褰掗浂**锛氫細璇濇暎鍦ㄥ崄鍑犱釜鐩綍閲岋紝娌℃湁涓€涓湴鏂硅兘鏁翠綋鎷疯蛋銆?- **鍐崇瓥鐣欎笉涓嬫潵**锛氱湡姝ｅ€奸挶鐨勬槸"褰撴椂涓轰粈涔堣繖涔堝畾"锛屽畠鍩嬪湪鍑犱竾鏉℃秷鎭噷锛屾悳涓嶅埌灏辩瓑浜庢病鏈夈€?
omnihist 瑙ｅ喅鐨勪笉鏄?鍐嶅仛涓€涓亰澶╁鎴风"锛岃€屾槸**鎶婂凡缁忓彂鐢熻繃鐨勫璇濆彉鎴愪竴浠藉彲妫€绱€佸彲澶囦唤銆佸彲浜ゆ帴鐨勮祫浜?*銆?
---

## 鐜板湪鏀寔浠€涔?
| 宸ュ叿 | 璇讳粈涔?| 骞冲彴 |
|---|---|---|
| **Claude Code** | `~/.claude/projects/**/*.jsonl` | macOS / Linux / Windows |
| **Codex CLI** | `~/.codex/sessions/**/rollout-*.jsonl` | 涓夊钩鍙?|
| **opencode** | `~/.local/share/opencode/opencode.db` | 涓夊钩鍙?|
| **WorkBuddy / CodeBuddy** | `~/.workbuddy/projects/**/*.jsonl`銆乣~/.codebuddy/projects` | 涓夊钩鍙?|
| **Qoder / Qoder CN** | `%APPDATA%/com.qodercn.app.stable/main.sqlite` 绛?| Windows / macOS |
| **OpenMausBot** | `~/.openmausbot/messages.db` | 涓夊钩鍙?|
| **DeepSeek Harness / DSH Desktop** | `~/.dsh/sessions/**/session.v4.jsonl.zstd` | 涓夊钩鍙?|
| **Grok Bot** | `%APPDATA%/Grok Bot/sand-client-persistence/*.blob` | Windows / macOS |
| **TRAE / TRAE CN / TRAE SOLO / TRAE Work** | `~/.trae-cn/memory/projects/**/session_memory_*.jsonl` | Windows / macOS |
| **Gemini CLI** | `~/.gemini/tmp/*/chats/*.json` | 涓夊钩鍙?|
| **OpenClaw** | `~/.openclaw/agents/*/sessions/*.jsonl` | 涓夊钩鍙?|
| **Aider** | `~/.aider.chat.history.md` | 涓夊钩鍙?|
| **Continue** | `~/.continue/sessions/*.json` | 涓夊钩鍙?|
| **Goose** | `~/.local/share/goose/sessions/*.jsonl` 绛?| 涓夊钩鍙?|
| **GitHub Copilot Chat** | VS Code `workspaceStorage/*/chatSessions/*.json` | 涓夊钩鍙?|
| **Cline / Roo Code / Kilo Code** | VS Code `globalStorage/*/tasks/*/api_conversation_history.json` | 涓夊钩鍙?|
| **ChatGPT 瀵煎嚭** | `conversations.json`锛圫ettings 鈫?Data controls 鈫?Export锛?| 鎵嬪姩瀵煎叆 |
| **Claude 瀵煎嚭** | `conversations.json`锛圫ettings 鈫?Export data锛?| 鎵嬪姩瀵煎叆 |

`omnihist scan` 浼氬湪浣犵殑鏈哄櫒涓婅嚜鍔ㄦ壘杩欎簺璺緞锛屾壘涓嶅埌灏辫烦杩囥€?
### 杩樻病鏀寔鐨勭儹闂ㄥ伐鍏?
| 宸ュ叿 | 涓轰粈涔堣繕娌″仛 |
|---|---|
| **Cursor** | 鑱婂ぉ瀛樺湪 `state.vscdb` 鐨勫唴閮ㄩ敭閲岋紝鏍煎紡闅忕増鏈彉锛屽鏄撹閿?|
| **Windsurf / Zed / Kiro / Warp** | 鍚勮嚜绉佹湁鏍煎紡锛岄渶瑕佸崟鐙€嗗悜 |
| **TRAE 鐨勫畬鏁村璇?* | 鑱婂ぉ搴撴槸鍔犲瘑鐨勶紙`ModularData/ai-chat/database.db`锛夛紝鍙兘璇?TRAE 鑷繁鍐欑殑 session memory |
| **JetBrains AI Assistant** | 瀛樺湪 IDE 鐨?XML/浜岃繘鍒?workspace 閲?|
| **Antigravity** | protobuf 鏃ュ織锛岄渶瑕佸崟鐙В鐮?|
| **GitHub Copilot CLI** | 鏃ュ織鏍煎紡鏈ǔ瀹?|
| **Qwen Code / Kimi Code / Amp / Devin / Factory / OpenHands / Jules** | 绀惧尯閫傞厤鍣ㄥ彲鍔狅紝浣嗚繕娌″啓 |
| **ChatGPT / Claude / Gemini 缃戦〉鐗堝疄鏃舵姄鍙?* | 闇€瑕佹祻瑙堝櫒鎵╁睍锛涚洰鍓嶅彧鏀寔瀵煎嚭鏂囦欢锛圙emini 瀵煎嚭涔熻繕娌¤В鏋愶級 |
| **Codex 鐨?`.jsonl.zst` 褰掓。** | 闇€瑕?zstd 瑙ｅ帇锛屽綋鍓嶈烦杩?|
| **浜?agent锛圕odex cloud銆丣ules銆丏evin cloud锛?* | 闇€瑕佸悇瀹?API锛屼笉鍦ㄦ湰鍦版枃浠堕噷 |

杩欏紶琛ㄥ氨鏄?roadmap銆傛瘡鍔犱竴涓紝鍙渶瑕佷竴涓?`src/adapters/xxx.mjs`銆?
---

## 瀹夎

闇€瑕?**Node.js 22.5+**锛堢敤鍒板唴缃殑 `node:sqlite`锛岄浂绗笁鏂逛緷璧栵級銆?
```bash
# 浠?npm锛堝彂甯冨悗锛?npm install -g omnihist

# 鎴栬€呯洿鎺ヤ粠 GitHub
npm install -g github:ysyluminous/omnihist

# 鎴栬€呭厠闅嗗悗鏈湴閾炬帴
git clone https://github.com/ysyluminous/omnihist.git
cd omnihist
npm link
```

妫€鏌ワ細

```bash
omnihist scan
```

浼氬垪鍑鸿繖鍙版満鍣ㄤ笂妫€娴嬪埌浜嗗摢浜涘伐鍏枫€佸垎鍒鍝釜璺緞銆?
---

## 浣跨敤

### 1. 鍚屾

```bash
omnihist sync
```

绗竴娆′細鎶婅兘璇诲埌鐨勫巻鍙插叏閮ㄥ鍏ワ紱涔嬪悗鍐嶈窇鍙鏂板鍜屽彉鍖栫殑閮ㄥ垎锛堟瘡涓簮璁颁竴涓父鏍囷級銆?
```bash
omnihist sync --source workbuddy     # 鍙悓姝ヤ竴涓伐鍏?omnihist sync --full                 # 蹇界暐娓告爣锛屽叏閮ㄩ噸鎵紙骞傜瓑锛屼笉浼氶噸澶嶏級
```

### 2. 鎼滅储

```bash
omnihist search "缂撳瓨閿?
omnihist search "connection pool exhausted" --limit 10
```

杈撳嚭浼氬甫鏉ユ簮銆佹椂闂淬€佹爣棰樸€佸懡涓墖娈靛拰浼氳瘽 id銆備腑鏂囨寜瀛楀垏鍒嗭紝涓や釜瀛椾篃鑳芥悳銆?
### 3. 鐪嬩竴鏉″璇?
```bash
omnihist list --limit 20
omnihist show <conversation-id>
omnihist export <conversation-id> --format md --out ./one.md
```

### 4. 缁熻

```bash
omnihist stats
```

### 5. 瀵煎叆瀹樻柟瀵煎嚭

```bash
omnihist import ~/Downloads/chatgpt-export
omnihist import ~/Downloads/claude-export/conversations.json
```

### 6. 璁?AI 鑷繁鏌ワ紙MCP锛?
omnihist 鑷甫涓€涓?stdio MCP server锛屾毚闇蹭笁涓伐鍏凤細

- `search_conversations` 鈥?璺ㄦ墍鏈夊伐鍏锋悳绱?- `get_conversation` 鈥?璇讳竴鏁存潯瀵硅瘽
- `list_recent` 鈥?鏈€杩戜細璇?
Claude Code锛?
```bash
claude mcp add omnihist -- omnihist mcp
```

opencode / 鍏朵粬 MCP 瀹㈡埛绔紙`mcp.json`锛夛細

```json
{
  "mcpServers": {
    "omnihist": {
      "command": "omnihist",
      "args": ["mcp"]
    }
  }
}
```

涔嬪悗鐩存帴闂?agent锛?鎴戜滑涔嬪墠鍏充簬缂撳瓨閿槸鎬庝箞瀹氱殑锛? 瀹冧細鑷繁鎼滃埌 Codex 鎴?Claude Code 閲岀殑閭ｆ潯瀵硅瘽銆?
---

## 瀹冩槸鎬庝箞鍋氱殑

- **鍙婧愭枃浠躲€?* 涓嶅啓鍥炰换浣曞伐鍏凤紝涓嶆敼浣犵殑閰嶇疆銆?- **涓€涓?SQLite 鏂囦欢銆?* 榛樿 `~/.omnihist/omnihist.db`锛屾嫹璧板氨鏄叏閮ㄣ€?- **澧為噺銆?* `sync_state` 璁版瘡涓簮鐨勬渶鍚庢椂闂达紱閲嶅璺戞槸骞傜瓑鐨勩€?- **鍘婚噸銆?* 姣忔潯娑堟伅绠?sha256锛涘悓涓€娈靛唴瀹瑰湪搴撻噷鍙湁涓€浠界储寮曪紝閲嶅瀵煎叆涓嶄細鑶ㄨ儉銆?- **涓枃鍙悳銆?* FTS5 + 鎸夊瓧鍒囧垎锛屼笉渚濊禆鍒嗚瘝鏈嶅姟銆?- **榛樿鑴辨晱銆?* 甯歌鐨?`sk-`銆乣ghp_`銆乣AKIA`銆丅earer token銆乸assword 瀛楁鍦ㄥ叆搴撳墠鏇挎崲鎴?`***`锛涜淇濈暀鍘熸枃鐢?`OMNIHIST_REDACT=0`銆?- **鍗曟潯娑堟伅涓婇檺 20 涓囧瓧绗?*锛岄伩鍏嶄竴鏉¤秴闀垮伐鍏疯緭鍑烘妸搴撴拺鐖嗭紱鍙敤 `OMNIHIST_MAX_CHARS` 璋冩暣銆?
鏁版嵁搴撳ぇ姒傚澶э紵鏈満 7 涓囨潯娑堟伅锛堝惈澶ч噺宸ュ叿杈撳嚭锛夌害 700MB銆傜函鑱婂ぉ浼氬皬寰堝銆?
---

## 鑷繁鍔犱竴涓€傞厤鍣?
鍦?`src/adapters/` 鏂板缓涓€涓枃浠讹紝瀵煎嚭 `id`銆乣name`銆乣detect()`銆乣scan()`锛?
```js
import path from 'node:path';
import { HOME, exists, walk, jsonl, textOf, titleFrom, toMs } from '../util.mjs';

export const id = 'my-tool';
export const name = 'My Tool';

export function detect() {
  const p = path.join(HOME, '.mytool', 'sessions');
  return exists(p) ? [{ path: p, label: '~/.mytool/sessions' }] : [];
}

export async function scan({ since = 0 } = {}) {
  const out = [];
  for (const fp of walk(detect()[0].path, (p, n) => n.endsWith('.jsonl'))) {
    const messages = [];
    for (const line of jsonl(fp)) {
      messages.push({ id: line.id, role: line.role, at: toMs(line.time), text: textOf(line.content) });
    }
    out.push({
      source: id,
      externalId: path.basename(fp, '.jsonl'),
      title: titleFrom(messages.find((m) => m.role === 'user')?.text),
      messages,
    });
  }
  return out;
}
```

鐒跺悗鍦?`src/adapters/index.mjs` 閲屽姞涓€琛?import 鍜屾暟缁勯」銆俙detect()` 杩斿洖绌烘暟缁勫氨绛変簬"杩欏彴鏈哄櫒娌¤"銆?
---

## 闅愮

- 鍏ㄩ儴鏁版嵁鍙湪鏈満锛屾病鏈夐仴娴嬨€佹病鏈変笂浼犮€佹病鏈夎处鍙枫€?- `omnihist` 涓嶄細淇敼浠讳綍婧愭枃浠躲€?- 榛樿鑴辨晱甯歌瀵嗛挜锛涗絾鍘嗗彶閲屽彲鑳借繕鏈夊埆鐨勬晱鎰熷唴瀹癸紝**杩欎釜搴撹鍍忚亰澶╄褰曟湰韬竴鏍蜂繚鎶?*銆?- 鎯冲悓姝ュ埌鍒殑鏈哄櫒锛氱洿鎺ユ嫹 `~/.omnihist/omnihist.db`锛堝厛鍋滄帀姝ｅ湪璺戠殑 sync锛夛紝鎴栬€呮斁杩涗綘鑷繁鐨勭鏈夌綉鐩樸€?
---

## 鍜屽埆鐨勫伐鍏蜂粈涔堝叧绯?
- **hstry / deja-vu / cass / Hansard** 閮藉緢寮猴紝鎬濊矾涓€鑷达細璇诲凡鏈変細璇濓紝鍋氫竴涓粺涓€绱㈠紩銆俹mnihist 鐨勫樊鍒槸锛氶浂渚濊禆銆佸崟鏂囦欢銆侀粯璁よ劚鏁忋€佷腑鏂囨寜瀛楁绱€侀€傞厤鍣?30 琛屼竴涓紝骞朵笖鍚屾椂瑕嗙洊 WorkBuddy + Qoder + OpenMausBot 杩欑被鍥藉唴/鑷缓宸ュ叿銆?- 瀹冧笉鏄亰澶╁鎴风锛屼笉鏇夸綘鍙戞秷鎭紝涓嶆帴绠′换浣曞伐鍏枫€?- 瀹冧篃涓嶆槸"璁板繂灞?锛堜笉鎶藉彇浜嬪疄銆佷笉鍋氬悜閲忓簱锛夈€傚畠鍏堟妸**鍘熷瀵硅瘽**鏀堕綈锛涙娊鍙栧拰鎬荤粨鍙互鍦ㄨ繖涓簱涔嬩笂鍋氥€?
---

## Roadmap

- [ ] Cursor / Windsurf / Zed / Kiro / TRAE 閫傞厤鍣?- [ ] Gemini Takeout 瀵煎嚭
- [ ] 娴忚鍣ㄦ墿灞曪紝瀹炴椂鏀?ChatGPT / Claude / Gemini 缃戦〉瀵硅瘽
- [ ] 鍙€夌殑璇箟妫€绱紙鏈湴 embedding锛?- [ ] `omnihist serve` 鏈湴 Web UI
- [ ] 鍔犲瘑搴擄紙SQLCipher 鎴栧簲鐢ㄥ眰锛?- [ ] 鍐崇瓥/寰呭姙鎶藉彇锛岃緭鍑?Markdown

---

## License

MIT銆傝 [LICENSE](LICENSE)銆?
鍋氳繖涓」鐩椂鍙傝€冧簡 hstry銆乨eja-vu銆乧ass銆丠ansard銆丳omnia 鐨勫叕寮€鏂囨。鍜岄€傞厤鍣ㄦ€濊矾锛屼唬鐮佷负鐙珛瀹炵幇銆?