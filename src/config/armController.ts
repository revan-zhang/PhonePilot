/**
 * 机械臂控制器配置
 */
export const ARM_CONTROLLER_CONFIG = {
  /** 默认服务器 IP 地址 */
  defaultServerIP: '192.168.1.236',
  /** API 服务端口 */
  apiPort: '8082',
  /** 默认串口 */
  defaultComPort: 'COM3',
  /** API 路径 */
  apiPath: '/MyWcfService/getstring',
  /** 连接后等待设备就绪的时间 (ms) */
  deviceReadyDelay: 2000,
  /** 命令间隔时间 (ms) */
  commandDelay: 300,
  /** 点击操作延时 (ms) */
  clickDelay: 250,
  /** 可选步长值 */
  stepOptions: [1, 5, 10, 20] as const,
  /** 默认步长 */
  defaultStepSize: 10,
} as const;

/**
 * 解析服务器响应
 * 服务器返回的是 JSON 格式的字符串（如 "1136"），需要去除引号
 */
export function parseServerResponse(response: string): string {
  return response.replace(/^"|"$/g, '');
}

/**
 * 解析资源句柄
 * 返回解析后的数字，如果解析失败返回 0
 */
export function parseResourceHandle(response: string): number {
  const cleanResult = parseServerResponse(response);
  const handle = parseInt(cleanResult, 10);
  return isNaN(handle) ? 0 : handle;
}

/**
 * 构建 API URL
 */
export function buildArmApiUrl(
  serverIP: string,
  params: { duankou: string; hco: number; daima: string }
): string {
  const { apiPort, apiPath } = ARM_CONTROLLER_CONFIG;
  const baseUrl = `http://${serverIP}:${apiPort}${apiPath}`;
  const queryParams = new URLSearchParams({
    duankou: params.duankou,
    hco: params.hco.toString(),
    daima: params.daima,
  });
  return `${baseUrl}?${queryParams.toString()}`;
}
