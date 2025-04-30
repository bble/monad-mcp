/**
 * Monad MCP Tutorial
 * 
 * This file demonstrates how to create a Model Context Protocol (MCP) server
 * that interacts with the Monad blockchain testnet to check MON balances.
 */

// Import necessary dependencies
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPublicClient, formatUnits, http } from "viem";
import { monadTestnet } from "viem/chains";

// Create a public client to interact with the Monad testnet
const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
});

// Initialize the MCP server with a name, version, and capabilities
// 初始化 MCP 服务器
const server = new McpServer({
    name: "monad-testnet",
    version: "0.0.1",
    // 定义服务器支持的功能列表
    capabilities: ["get-mon-balance", "get-nft-count"]
  });

// Define a tool that gets the MON balance for a given address
server.tool(
    // 功能标识符
    "get-mon-balance",
    // 功能说明
    "查询 Monad 测试网地址的 MON 代币余额",
    // 参数定义
    {
        address: z.string().describe("需要查询的 Monad 测试网地址"),
    },
    // 功能实现
    async ({ address }) => {
        try {
            // 调用接口查询余额
            const balance = await publicClient.getBalance({
                address: address as `0x${string}`,
            });

            // 返回格式化的查询结果
            return {
                content: [
                    {
                        type: "text",
                        text: `地址 ${address} 的 MON 余额为：${formatUnits(balance, 18)} MON`,
                    },
                ],
            };
        } catch (error) {
            // 错误处理
            return {
                content: [
                    {
                        type: "text",
                        text: `查询地址 ${address} 的余额失败：${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

// 添加查询 NFT 数量的功能
server.tool(
    // 功能标识符
    "get-nft-count",
    // 功能说明
    "查询 Monad 测试网地址持有的 NFT 数量",
    // 参数定义
    {
        address: z.string().describe("需要查询的 Monad 测试网地址"),
        nftContract: z.string().describe("NFT 合约地址")
    },
    // 功能实现
    async ({ address, nftContract }) => {
        try {
            // 调用合约的 balanceOf 方法查询 NFT 数量
            const balance = await publicClient.readContract({
                address: nftContract as `0x${string}`,
                abi: [
                    {
                        inputs: [{ name: "owner", type: "address" }],
                        name: "balanceOf",
                        outputs: [{ name: "", type: "uint256" }],
                        stateMutability: "view",
                        type: "function"
                    }
                ],
                functionName: "balanceOf",
                args: [address as `0x${string}`]
            });

            // 返回格式化的查询结果
            return {
                content: [
                    {
                        type: "text",
                        text: `地址 ${address} 在合约 ${nftContract} 中持有的 NFT 数量为：${balance.toString()} 个`,
                    },
                ],
            };
        } catch (error) {
            // 错误处理
            return {
                content: [
                    {
                        type: "text",
                        text: `查询地址 ${address} 的 NFT 数量失败：${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

/**
 * Main function to start the MCP server
 * Uses stdio for communication with LLM clients
 */
async function main() {
    // 配置标准输入输出作为通信通道
    const transport = new StdioServerTransport();
    
    // 建立服务器连接
    await server.connect(transport);
    
    console.error("Monad 测试网 MCP 服务器已启动");
}

// Start the server and handle any fatal errors
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
