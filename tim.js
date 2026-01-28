import TIM from "tim-js-sdk";
import TIMUploadPlugin from "tim-upload-plugin";

let tim = null;
let isInitialized = false;

// 初始化SDK
export const initTIM = async (options) => {
  if (isInitialized && tim) {
    return tim;
  }

  try {
    tim = TIM.create({ SDKAppID: options.SDKAppID });
    tim.setLogLevel(options.level || 0);
    tim.registerPlugin({ "tim-upload-plugin": TIMUploadPlugin });

    isInitialized = true;
    console.log("TIM SDK 初始化成功");

    return tim;
  } catch (error) {
    console.error("TIM SDK 初始化失败:", error);
    throw error;
  }
};

// 登录
export const loginTIM = async ({ userID, userSig }) => {
  if (!tim) {
    throw new Error("请先初始化SDK");
  }

  try {
    const loginResponse = await tim.login({ userID, userSig });
    console.log("登录成功:", loginResponse);
    return loginResponse;
  } catch (error) {
    console.error("登录失败:", error);
    throw error;
  }
};

// 登出
export const logoutTIM = async () => {
  if (!tim) {
    throw new Error("SDK未初始化");
  }

  try {
    const logoutResponse = await tim.logout();
    console.log("登出成功:", logoutResponse);
    return logoutResponse;
  } catch (error) {
    console.error("登出失败:", error);
    throw error;
  }
};

// 发送文本消息
export const sendTextMsg = async ({ to, text }) => {
  if (!tim) {
    throw new Error("SDK未初始化");
  }

  try {
    const message = tim.createTextMessage({
      to: to,
      conversationType: TIM.TYPES.CONV_C2C,
      payload: { text },
    });

    const response = await tim.sendMessage(message);
    console.log("文本消息发送成功:", response);
    return response;
  } catch (error) {
    console.error("发送文本消息失败:", error);
    throw error;
  }
};

// 发送图片消息（需先注册 tim-upload-plugin）
export const sendImageMsg = async ({ to, file }) => {
  if (!tim) throw new Error("SDK未初始化");
  if (!file) throw new Error("请选择图片文件");

  const message = tim.createImageMessage({
    to,
    conversationType: TIM.TYPES.CONV_C2C,
    payload: { file },
  });
  const res = await tim.sendMessage(message);
  return res;
};

// 发送视频消息
export const sendVideoMsg = async ({ to, file }) => {
  if (!tim) throw new Error("SDK未初始化");
  if (!file) throw new Error("请选择视频文件");

  const message = tim.createVideoMessage({
    to,
    conversationType: TIM.TYPES.CONV_C2C,
    payload: { file },
  });
  const res = await tim.sendMessage(message);
  return res;
};

// 发送文件消息（用于音频、文档等任意文件）
export const sendFileMsg = async ({ to, file }) => {
  if (!tim) throw new Error("SDK未初始化");
  if (!file) throw new Error("请选择文件");

  const message = tim.createFileMessage({
    to,
    conversationType: TIM.TYPES.CONV_C2C,
    payload: { file },
  });
  const res = await tim.sendMessage(message);
  return res;
};

// 发送自定义消息
// TIM 要求 payload.data / description / extension 均为字符串，不能传对象
export const sendCustomMsg = async ({ to, data, description }) => {
  if (!tim) {
    throw new Error("SDK未初始化");
  }

  try {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const descStr = typeof description === 'string' ? description : dataStr;

    const message = tim.createCustomMessage({
      to,
      conversationType: TIM.TYPES.CONV_C2C,
      payload: {
        data: dataStr,
        description: descStr,
        extension: ''
      }
    });

    const response = await tim.sendMessage(message);
    console.log("自定义消息发送成功:", response);
    return response;
  } catch (error) {
    console.error("发送自定义消息失败:", error);
    throw error;
  }
};

// 获取会话列表
export const getConversations = async () => {
  if (!tim) {
    throw new Error("SDK未初始化");
  }

  try {
    const response = await tim.getConversationList();
    console.log("获取会话列表成功:", response);
    return response.data.conversationList || [];
  } catch (error) {
    console.error("获取会话列表失败:", error);
    throw error;
  }
};

// 监听消息事件
export const onMessageReceived = (callback) => {
  if (!tim) {
    throw new Error("请先初始化SDK");
  }

  tim.on(TIM.EVENT.MESSAGE_RECEIVED, callback);
};

// 移除消息监听
export const offMessageReceived = (callback) => {
  if (!tim) {
    throw new Error("SDK未初始化");
  }

  tim.off(TIM.EVENT.MESSAGE_RECEIVED, callback);
};

// 获取SDK实例
export const getTIMInstance = () => {
  return tim;
};

// 导出TIM常量
export { TIM };
