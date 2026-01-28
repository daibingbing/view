<template>
  <div class="container">

    <IMStatus :sdk-ready="sdkReady" :login-status="loginStatus" :user-id="userId" />

    <div v-if="!loginStatus" class="login-section">
      <h2>登录IM</h2>
      <div class="input-group">
        <input v-model="loginUserId" type="text" placeholder="输入用户ID" class="input" />
        <select v-model="loginUserSig" class="select">
          <option value="">选择测试用户签名</option>
          <option v-for="user in testUsers" :key="user.userId" :value="user.userSig">
            {{ user.name }} ({{ user.userId }})
          </option>
        </select>
        <button @click="handleLogin" :disabled="!loginUserId || !loginUserSig" class="btn btn-primary">
          登录
        </button>
      </div>
      <p class="note">注意：实际项目中，userSig应由服务端生成</p>
    </div>

    <div v-if="loginStatus" class="message-section">
      <div class="function-row">
        <button @click="handleLogout" class="btn btn-secondary">退出登录</button>
        <button @click="getConversationList" class="btn">获取会话列表</button>
        <button @click="clearLog" class="btn">清空日志</button>
      </div>

      <div class="message-controls">
        <h3>发送消息</h3>
        <div class="input-group">
          <input v-model="targetUserId" type="text" placeholder="接收方用户ID" class="input" />
          <input v-model="messageContent" type="text" placeholder="消息内容" class="input" @keyup.enter="sendTextMessage" />
          <button @click="sendTextMessage" :disabled="!targetUserId || !messageContent" class="btn btn-primary">
            发送文本消息
          </button>
        </div>

        <div class="custom-send-card">
          <h4 class="custom-send-title">自定义发送</h4>
          <textarea
            v-model="customMessage"
            class="custom-send-input"
            placeholder="输入自定义消息..."
            rows="3"
          />
          <div class="custom-send-footer">
            <div class="custom-send-icons">
              <input ref="imageInputRef" type="file" accept="image/*" class="file-input" @change="onImageSelected" />
              <input ref="videoInputRef" type="file" accept="video/*" class="file-input" @change="onVideoSelected" />
              <input ref="audioInputRef" type="file" accept="audio/*" class="file-input" @change="onAudioSelected" />
              <input ref="fileInputRef" type="file" class="file-input" @change="onFileSelected" />
              <button
                type="button"
                class="icon-btn"
                title="图片"
                :disabled="!targetUserId"
                @click="imageInputRef?.click()"
              >
                <span class="icon">🖼️</span>
              </button>
              <button
                type="button"
                class="icon-btn"
                title="视频"
                :disabled="!targetUserId"
                @click="videoInputRef?.click()"
              >
                <span class="icon">🎬</span>
              </button>
              <button
                type="button"
                class="icon-btn"
                title="音频"
                :disabled="!targetUserId"
                @click="audioInputRef?.click()"
              >
                <span class="icon">🎤</span>
              </button>
              <button
                type="button"
                class="icon-btn"
                title="文件"
                :disabled="!targetUserId"
                @click="fileInputRef?.click()"
              >
                <span class="icon">📎</span>
              </button>
            </div>
            <button
              type="button"
              class="btn-send-main"
              :disabled="!targetUserId || !customMessage"
              @click="sendCustomMessage"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <!-- 消息展示区域 -->
      <div class="message-display">
        <h3>消息记录</h3>
        <div class="message-list">
          <div v-for="(msg, index) in messageList" :key="index" :class="['message-item', msg.direction]">
            <span class="sender">{{ msg.from }}</span>
            <span class="time">{{ msg.time }}</span>
            <div class="content">
              <template v-if="msg.type === 'image' && msg.url">
                <img :src="msg.url" alt="图片" class="msg-media msg-image" />
              </template>
              <template v-else-if="msg.type === 'video' && msg.url">
                <video :src="msg.url" controls class="msg-media msg-video" />
                <span v-if="msg.name" class="msg-filename">{{ msg.name }}</span>
              </template>
              <template v-else-if="msg.type === 'audio' && msg.url">
                <audio :src="msg.url" controls class="msg-media msg-audio" />
                <span v-if="msg.name" class="msg-filename">{{ msg.name }}</span>
              </template>
              <template v-else-if="msg.type === 'file' && msg.url">
                <a :href="msg.url" target="_blank" rel="noopener" class="msg-file-link">{{ msg.content }}</a>
              </template>
              <template v-else>
                {{ msg.content }}
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="log-section">
        <h3>操作日志</h3>
        <div class="log-container">
          <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
            <span class="timestamp">[{{ log.time }}]</span>
            <span class="content">{{ log.content }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import IMStatus from './IMStatus.vue'
import {
  initTIM,
  loginTIM,
  logoutTIM,
  sendTextMsg,
  sendCustomMsg,
  sendImageMsg,
  sendVideoMsg,
  sendFileMsg,
  getConversations,
  onMessageReceived,
  offMessageReceived,
  TIM
} from '@/utils/tim'


// 响应式数据
const sdkReady = ref(false)
const loginStatus = ref(false)
const userId = ref('')
const messageList = ref([])

// 登录相关
const loginUserId = ref('user1')
const loginUserSig = ref('')
const targetUserId = ref('user2')
const messageContent = ref('')
const customMessage = ref('')

const imageInputRef = ref(null)
const videoInputRef = ref(null)
const audioInputRef = ref(null)
const fileInputRef = ref(null)

// 测试用户数据
const testUsers = ref([
  { userId: 'user1', name: '测试用户1', userSig: 'eJw1zF0LgjAYBeD-suuQd6ttKnRZWAlBZdSlto-eIhvOTIj*e6Z1eZ5zOC*yS7dBoysSExYAGfUZlS5rNNjzw*uK-gqvrrlzqEhMBQBlEyHF0OjWYaU755wzABi0xtvXpIh4KKL-1qPtfpNLWTRtws3BLiXS8Tq081nmTL4-09PzqP09tZncrPwCpuT9ASnZMaA_' },
  { userId: 'user2', name: '测试用户2', userSig: 'eJyrVgrxCdYrSy1SslIy0jNQ0gHzM1NS80oy0zLBwqXFqUVGUInilOzEgoLMFCUrQzMDA0MjEzNzM4hMakVBZlEqUNzU1NTIwMAAIlqSmQsSMzezNLUwh4sWZ6YDzc3wiNGvsDR1dNcurwrOzggy0a7wTHdOrSpzSQ8INElNcY30tHA2qsrLDPJItlWqBQBGHzF9' }
])

// 日志
const logs = ref([])

// 添加日志
const addLog = (content, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, content, type })
  console.log(`[${type.toUpperCase()}] ${content}`)
}

// 清空日志
const clearLog = () => {
  logs.value = []
  addLog('日志已清空', 'info')
}

// 从 TIM 消息提取展示用的 type、content、url、name
const normalizeMessage = (message) => {
  const base = {
    from: message.from,
    to: message.to,
    time: new Date().toLocaleTimeString(),
    direction: message.from === userId.value ? 'outgoing' : 'incoming'
  }
  const p = message.payload || {}

  if (message.type === TIM.TYPES.MSG_IMAGE) {
    const info = p.imageInfoArray?.[0]
    return {
      ...base,
      type: 'image',
      content: '[图片]',
      url: info?.url || p.url,
      name: p.file?.name
    }
  }
  if (message.type === TIM.TYPES.MSG_VIDEO) {
    return {
      ...base,
      type: 'video',
      content: '[视频]',
      url: p.videoUrl || p.url,
      name: p.file?.name
    }
  }
  if (message.type === TIM.TYPES.MSG_FILE) {
    return {
      ...base,
      type: 'file',
      content: `[文件] ${p.fileName || p.file?.name || '未知文件'}`,
      url: p.fileUrl || p.url,
      name: p.fileName || p.file?.name
    }
  }
  if (message.type === TIM.TYPES.MSG_AUDIO) {
    return {
      ...base,
      type: 'audio',
      content: '[音频]',
      url: p.videoUrl || p.soundUrl || p.fileUrl || p.url,
      name: p.file?.name
    }
  }
  const textContent = p.text || p.description || p.data || '未知消息类型'
  return {
    ...base,
    type: p.data && !p.text ? 'custom' : 'text',
    content: typeof textContent === 'string' ? textContent : String(textContent)
  }
}

// 处理新消息
const handleNewMessage = (event) => {
  event.data.forEach((message) => {
    const newMsg = normalizeMessage(message)
    messageList.value.push(newMsg)
    addLog(`收到消息: ${message.from} -> ${message.to}: ${newMsg.content}`, 'message')
  })
}

// 初始化SDK
const initSDK = async () => {
  try {
    const tim = await initTIM({
      SDKAppID: 1600124676, // 请替换为您的SDKAppID
      level: 0 // 日志级别: 0普通，1详细
    })

    // 监听连接状态变化
    tim.on(TIM.EVENT.SDK_READY, () => {
      sdkReady.value = true
      addLog('SDK准备就绪', 'success')
    })

    tim.on(TIM.EVENT.SDK_NOT_READY, () => {
      sdkReady.value = false
      addLog('SDK未就绪', 'warning')
    })
    // 消息监听在登录时通过 onMessageReceived 注册，避免与 handleLogin 中的注册重复导致每条消息处理两次
    tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, () => {
      addLog('会话列表已更新', 'info')
    })

  } catch (error) {
    addLog(`SDK初始化失败: ${error.message}`, 'error')
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginUserId.value || !loginUserSig.value) {
    addLog('请输入用户ID和userSig', 'warning')
    return
  }
  try {
    await loginTIM({
      userID: loginUserId.value,
      userSig: loginUserSig.value
    })

    loginStatus.value = true
    userId.value = loginUserId.value
    messageList.value = [] // 清空消息列表
    addLog(`用户 ${loginUserId.value} 登录成功`, 'success')

    // 设置消息监听
    onMessageReceived(handleNewMessage)

  } catch (error) {
    addLog(`登录失败: ${error.message}`, 'error')
  }
}

// 处理退出登录
const handleLogout = async () => {
  try {
    // 移除消息监听
    offMessageReceived(handleNewMessage)

    await logoutTIM()
    loginStatus.value = false
    userId.value = ''
    messageList.value = [] // 清空消息列表
    addLog('退出登录成功', 'info')
  } catch (error) {
    addLog(`退出登录失败: ${error.message}`, 'error')
  }
}

// 发送文本消息
const sendTextMessage = async () => {
  if (!targetUserId.value || !messageContent.value) {
    addLog('请输入接收方和消息内容', 'warning')
    return
  }

  try {
    await sendTextMsg({
      to: targetUserId.value,
      text: messageContent.value
    })

    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: messageContent.value,
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing',
      type: 'text'
    })

    addLog(`发送消息给 ${targetUserId.value}: ${messageContent.value}`, 'message')
    messageContent.value = ''

  } catch (error) {
    addLog(`发送消息失败: ${error.message}`, 'error')
  }
}

// 发送自定义消息
const sendCustomMessage = async () => {
  if (!targetUserId.value || !customMessage.value) {
    addLog('请输入接收方和自定义消息', 'warning')
    return
  }

  try {
    await sendCustomMsg({
      to: targetUserId.value,
      data: JSON.stringify({ customData: customMessage.value, timestamp: Date.now() }),
      description: customMessage.value
    })

    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: customMessage.value,
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing',
      type: 'custom'
    })

    addLog(`发送自定义消息给 ${targetUserId.value}: ${customMessage.value}`, 'message')
    customMessage.value = ''
  } catch (error) {
    addLog(`发送自定义消息失败: ${error.message}`, 'error')
  }
}

const clearFileInput = (el) => {
  if (el && el.value) el.value = ''
}

const onImageSelected = async (e) => {
  const file = e.target?.files?.[0]
  if (!file || !targetUserId.value) return
  try {
    await sendImageMsg({ to: targetUserId.value, file })
    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: '[图片]',
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing',
      type: 'image',
      url: URL.createObjectURL(file),
      name: file.name
    })
    addLog(`发送图片给 ${targetUserId.value}: ${file.name}`, 'message')
  } catch (err) {
    addLog(`发送图片失败: ${err.message}`, 'error')
  }
  clearFileInput(e.target)
}

const onVideoSelected = async (e) => {
  const file = e.target?.files?.[0]
  if (!file || !targetUserId.value) return
  try {
    await sendVideoMsg({ to: targetUserId.value, file })
    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: '[视频]',
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing',
      type: 'video',
      url: URL.createObjectURL(file),
      name: file.name
    })
    addLog(`发送视频给 ${targetUserId.value}: ${file.name}`, 'message')
  } catch (err) {
    addLog(`发送视频失败: ${err.message}`, 'error')
  }
  clearFileInput(e.target)
}

const onAudioSelected = async (e) => {
  const file = e.target?.files?.[0]
  if (!file || !targetUserId.value) return
  try {
    await sendFileMsg({ to: targetUserId.value, file })
    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: '[音频]',
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing',
      type: 'audio',
      url: URL.createObjectURL(file),
      name: file.name
    })
    addLog(`发送音频给 ${targetUserId.value}: ${file.name}`, 'message')
  } catch (err) {
    addLog(`发送音频失败: ${err.message}`, 'error')
  }
  clearFileInput(e.target)
}

const onFileSelected = async (e) => {
  const file = e.target?.files?.[0]
  if (!file || !targetUserId.value) return
  try {
    await sendFileMsg({ to: targetUserId.value, file })
    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: `[文件] ${file.name}`,
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing',
      type: 'file',
      url: URL.createObjectURL(file),
      name: file.name
    })
    addLog(`发送文件给 ${targetUserId.value}: ${file.name}`, 'message')
  } catch (err) {
    addLog(`发送文件失败: ${err.message}`, 'error')
  }
  clearFileInput(e.target)
}

// 获取会话列表
const getConversationList = async () => {
  try {
    const conversations = await getConversations()
    addLog(`获取到 ${conversations.length} 个会话`, 'info')
    conversations.forEach(conv => {
      console.log(conv, "getTestUsersgetTestUsers")
      addLog(`会话: ${conv.conversationID} (${conv.type})`, 'info')
    })
  } catch (error) {
    addLog(`获取会话列表失败: ${error.message}`, 'error')
  }
}

// 生命周期钩子
onMounted(() => {
  initSDK()
})

onUnmounted(() => {
  // 清理工作
  if (loginStatus.value) {
    handleLogout()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 100%;
  max-width: 900px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  color: #333;
  margin-bottom: 24px;
  text-align: center;
  font-size: 28px;
}

h2,
h3 {
  color: #444;
  margin: 20px 0 15px;
  font-size: 20px;
}

.login-section,
.message-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.input-group {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  pointer-events: none;
}

.custom-send-card {
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0 2px 16px rgba(102, 126, 234, 0.1);
  position: relative;
}

.custom-send-title {
  color: #444;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.custom-send-input {
  width: 100%;
  min-height: 72px;
  padding: 12px 14px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  background: #f8f9fa;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.custom-send-input::placeholder {
  color: #999;
}

.custom-send-input:focus {
  outline: none;
  background: #f0f2f5;
}

.custom-send-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.custom-send-icons {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.12);
}

.icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.icon-btn .icon {
  font-size: 20px;
  line-height: 1;
}

.btn-send-main {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.15s;
}

.btn-send-main:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

.btn-send-main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input,
.select {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input:focus,
.select:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.function-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.message-display {
  margin-top: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.message-item {
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 8px;
  position: relative;
}

.message-item.incoming {
  background: #e3f2fd;
  margin-right: 20%;
}

.message-item.outgoing {
  background: #e8f5e9;
  margin-left: 20%;
  text-align: right;
}

.sender {
  font-weight: bold;
  color: #333;
}

.time {
  font-size: 12px;
  color: #666;
  margin: 0 10px;
}

.content {
  margin-top: 5px;
  word-break: break-word;
}

.msg-media {
  display: block;
  margin-top: 4px;
  max-width: 100%;
}

.msg-image {
  max-width: 240px;
  max-height: 180px;
  border-radius: 6px;
  object-fit: contain;
}

.msg-video {
  max-width: 280px;
  max-height: 160px;
  border-radius: 6px;
}

.msg-audio {
  width: 100%;
  max-width: 280px;
  height: 36px;
}

.msg-file-link {
  color: #667eea;
  text-decoration: none;
}

.msg-file-link:hover {
  text-decoration: underline;
}

.msg-filename {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.log-section {
  margin-top: 30px;
}

.log-container {
  height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background: white;
}

.log-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
}

.log-item.info {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.log-item.success {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.log-item.warning {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.log-item.error {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.log-item.message {
  background: #f3e5f5;
  border-left: 4px solid #9c27b0;
}

.timestamp {
  color: #666;
  margin-right: 10px;
  font-size: 12px;
}

.note {
  color: #666;
  font-size: 12px;
  margin-top: 10px;
  font-style: italic;
}
</style>