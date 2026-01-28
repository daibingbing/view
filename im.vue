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

        <div class="input-group">
          <input v-model="customMessage" type="text" placeholder="自定义消息" class="input" />
          <button @click="sendCustomMessage" :disabled="!targetUserId || !customMessage" class="btn">
            发送自定义消息
          </button>
        </div>
      </div>

      <!-- 消息展示区域 -->
      <div class="message-display">
        <h3>消息记录</h3>
        <div class="message-list">
          <div v-for="(msg, index) in messageList" :key="index" :class="['message-item', msg.direction]">
            <span class="sender">{{ msg.from }}</span>
            <span class="time">{{ msg.time }}</span>
            <div class="content">{{ msg.content }}</div>
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

// 处理新消息
const handleNewMessage = (event) => {
  event.data.forEach(message => {
    const msgContent = message.payload.text ||
      (message.payload.data ? JSON.stringify(message.payload.data) : '未知消息类型')

    const newMsg = {
      from: message.from,
      to: message.to,
      content: msgContent,
      time: new Date().toLocaleTimeString(),
      direction: message.from === userId.value ? 'outgoing' : 'incoming'
    }

    messageList.value.push(newMsg)
    addLog(`收到消息: ${message.from} -> ${message.to}: ${msgContent}`, 'message')
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

    // 监听消息事件
    tim.on(TIM.EVENT.MESSAGE_RECEIVED, handleNewMessage)

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

    // 添加到消息列表
    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: messageContent.value,
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing'
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
      data: { customData: customMessage.value, timestamp: Date.now() }
    })

    // 添加到消息列表
    messageList.value.push({
      from: userId.value,
      to: targetUserId.value,
      content: customMessage.value,
      time: new Date().toLocaleTimeString(),
      direction: 'outgoing'
    })

    addLog(`发送自定义消息给 ${targetUserId.value}: ${customMessage.value}`, 'message')
    customMessage.value = ''

  } catch (error) {
    addLog(`发送自定义消息失败: ${error.message}`, 'error')
  }
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