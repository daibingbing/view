<template>
    <div class="status-container">
      <div class="status-indicators">
        <div class="status-item">
          <span class="status-label">SDK状态:</span>
          <span :class="['status-dot', sdkReady ? 'ready' : 'not-ready']"></span>
          <span class="status-text">{{ sdkReady ? '就绪' : '未就绪' }}</span>
        </div>
        
        <div class="status-item">
          <span class="status-label">登录状态:</span>
          <span :class="['status-dot', loginStatus ? 'logged-in' : 'logged-out']"></span>
          <span class="status-text">{{ loginStatus ? '已登录' : '未登录' }}</span>
        </div>
        
        <div v-if="loginStatus" class="status-item">
          <span class="status-label">用户ID:</span>
          <span class="user-id">{{ userId }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    sdkReady: {
      type: Boolean,
      default: false
    },
    loginStatus: {
      type: Boolean,
      default: false
    },
    userId: {
      type: String,
      default: ''
    }
  })
  </script>
  
  <style scoped>
  .status-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .status-indicators {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    font-size: 14px;
  }
  
  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: background-color 0.3s;
  }
  
  .status-dot.ready {
    background-color: #4caf50;
    box-shadow: 0 0 10px #4caf50;
  }
  
  .status-dot.not-ready {
    background-color: #f44336;
    box-shadow: 0 0 10px #f44336;
  }
  
  .status-dot.logged-in {
    background-color: #4caf50;
    box-shadow: 0 0 10px #4caf50;
  }
  
  .status-dot.logged-out {
    background-color: #ff9800;
    box-shadow: 0 0 10px #ff9800;
  }
  
  .user-id {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
  }
  </style>