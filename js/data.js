/* ============================================================================
 * 点滴团队 · 资金公开公示网站 —— 数据文件（data.js）
 * ----------------------------------------------------------------------------
 * 【这个文件是干什么的？】
 *   网站上显示的所有内容（团队名、联系方式、说明文字、每一笔收支）都写在这里。
 *   网页本身是"死"的，改这个文件里的文字和数字，刷新网页就会变。
 *
 * 【日常更新只需要做一件事】
 *   在本文件最下面的 records 列表里，照着模板复制一行，改成新的一笔收支即可。
 *   详细的图文步骤请看：工程管理/账目更新指南.md
 *
 * 【修改时的 5 条铁律】
 *   1. 只能改冒号 ":" 后面的内容，不要删字段名（date / type / category / desc / amount）。
 *   2. 文字内容必须用英文单引号或双引号包起来，例如：'买元器件'。
 *   3. 金额是数字，【不要】加引号、不要加 ¥、不要加千分位逗号：
 *        正确： amount: 356.5
 *        错误： amount: '356.5元'   amount: "1,200"
 *   4. 每一条记录之间用英文逗号 "," 隔开；最后一条记录后面可加可不加逗号。
 *   5. 日期格式固定为 'YYYY-MM-DD'（年-月-日，月日不足两位补 0），如 '2026-09-05'。
 *
 * 【新增一条记录的模板】（复制下面这行，改好后粘到 records 列表里即可）
 *   { date: '2026-09-10', type: 'expense', category: '元器件/物料', desc: '在这里写这笔钱花在了哪里', amount: 100, voucher: '' },
 *
 * 【字段说明】
 *   date     日期，字符串，格式 'YYYY-MM-DD'
 *   type     类型，只有两种：'income' = 收入（钱进团队账户）
 *                            'expense' = 支出（钱从团队账户花出去）
 *   category 分类，建议从本文件 site.categories 列表里选；也可以自己写新分类
 *   desc     摘要，一句话说明这笔钱的来龙去脉
 *   amount   金额，数字，单位元，可带两位小数
 *   voucher  【预留扩展字段】凭证说明或凭证照片链接，暂时留空引号 '' 即可，不填不影响显示
 *
 * 【注意】本文件使用普通 JavaScript 语法（不是 JSON），所以可以写注释、
 *         末尾逗号也宽松。请勿重命名 FUND_DATA。
 * ========================================================================== */

const FUND_DATA = {

  /* ==========================================================================
   * 第一部分：站点信息与文案配置（site）
   * 改网站标题、联系方式、说明文字、功能开关，都在这里。
   * ======================================================================== */
  site: {

    // 团队名称与网页标题（显示在浏览器标签页和页面顶部）
    teamName: '点滴团队',
    siteTitle: '点滴团队 · 资金公开公示',

    // ---- 联系方式（监督联系板块使用）----
    email: 'm15397763602@163.com',      // 监督反馈邮箱（点击"发送监督邮件"会自动写信到这里）
    qq: '3513992041',                   // 联系 QQ（网页上可一键复制）
    githubUser: 'lsl-sys',              // GitHub 用户名
    githubUrl: 'https://github.com/lsl-sys', // GitHub 主页链接

    // ---- 功能开关（想关掉某个功能就把 true 改成 false）----
    features: {
      showCharts: true,    // 是否显示"余额趋势折线图 / 支出占比环"两个图表
      showTimeline: true,  // 是否显示"资金流水时间线"板块
    },

    // ---- 分类配置（下拉/标签里的分类从这里来，可自行增删）----
    categories: {
      income:  ['初始注入', '追加注入', '其他收入'],
      expense: ['元器件/物料', '设备/工具', '赛事/活动', '其他'],
    },

    // ---- 资金用途说明板块的文案（可直接改文字，原则/规则可增删条目）----
    purpose: {
      // 资金性质：一段话说明这笔钱是什么
      nature: '本账户资金为点滴团队公有资金，由团队成员注入并用于团队共同事务。资金不属于任何个人，任何支出均须用于团队用途。',
      // 使用原则：每条一个字符串，想用几条写几条
      principles: [
        '专款专用：仅用于团队元器件物料、设备工具、赛事活动等公共开支，不用于个人消费。',
        '全程留痕：每笔收支当日登记，金额、用途、经手人记录在案，凭证留存备查。',
        '公开透明：账目实时公示在本页面，任何成员均可查阅、提出异议。',
      ],
      // 公示规则：每条一个字符串
      rules: [
        '公示频率：随发生随公示，最迟不超过支出发生后 48 小时更新。',
        '凭证留存：购物小票、订单截图、支付记录等凭证由经手人保存至少一年。',
        '监督方式：如对账目有疑问，可通过页面底部邮箱发信监督，团队将在 3 日内答复。',
      ],
    },
  },

  /* ==========================================================================
   * 第二部分：账目记录（records）
   * 这是一个列表，列表里每一对 { ... } 就是一笔账。
   * 顺序无所谓，网页会自动按日期从新到旧排列。
   * ======================================================================== */
  records: [

    // —— 经费交接：接手时账户实际结余 ——
    {
      date: '2026-09-05',
      type: 'income',
      category: '初始注入',
      desc: '团队经费交接：接手时账户实际结余 10109.18 元，接手后暂无支出',
      amount: 10109.18,
      voucher: '',   // 预留字段：可填凭证说明/照片链接，留空即可
    },

    // —— 项目耗材：USB 网卡 + 路由器天线 ——
    {
      date: '2026-09-17',
      type: 'expense',
      category: '元器件/物料',
      desc: '项目耗材：绿联 USB3.0 有线网卡 × 2 件（绿联数码旗舰店）+ 流星聚合 5G 全频段路由器天线 × 1 件（流星聚合官方旗舰店），经手人刘艺',
      amount: 66.73,
      voucher: '',
    },

    // —— 项目物料购买 ——
    {
      date: '2026-09-18',
      type: 'expense',
      category: '元器件/物料',
      desc: '项目物料购买，经手人李斯理',
      amount: 400,
      voucher: '',
    },

    // —— 批量采购第一批：项目物料 16 笔订单（2026-09-16 ~ 09-19，经手人李斯理）——
    // 注：流浪猫猫碗 ¥8.00 与 Trae CN 会员 ¥89.00 非团队支出，未登记
    {
      date: '2026-09-16',
      type: 'expense',
      category: '元器件/物料',
      desc: 'ESP32-S3FH4R2 QFN-56（深圳市新纶电子），经手人李斯理',
      amount: 5.79,
      voucher: '',
    },
    {
      date: '2026-09-18',
      type: 'expense',
      category: '元器件/物料',
      desc: 'CM-K230 核心板 16G/1G（01Studio官方店），经手人李斯理',
      amount: 363.00,
      voucher: '',
    },
    {
      date: '2026-09-18',
      type: 'expense',
      category: '设备/工具',
      desc: '防静电手套 M 码（淮柔广州专卖店），经手人李斯理',
      amount: 34.00,
      voucher: '',
    },
    {
      date: '2026-09-18',
      type: 'expense',
      category: '元器件/物料',
      desc: '散热片 40×11 带风扇带背胶 ×2（文豪永顺旗舰店），经手人李斯理',
      amount: 29.58,
      voucher: '',
    },
    {
      date: '2026-09-18',
      type: 'expense',
      category: '元器件/物料',
      desc: '淘晶驰 T1 系列 4.3 寸串口电容屏 ×2，经手人李斯理',
      amount: 120.00,
      voucher: '',
    },
    {
      date: '2026-09-18',
      type: 'expense',
      category: '元器件/物料',
      desc: 'AP6256 无线模块 ×2（华迈芯电子），经手人李斯理',
      amount: 47.00,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: 'GC2093 自动对焦摄像头（K230 用）×2（01Studio官方店），经手人李斯理',
      amount: 143.00,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: '元件合单：QMC5883P + TPS54561 + BMI270 + ME6217×10 + SHT30（深圳市优信电子），经手人李斯理',
      amount: 41.97,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: 'CSNP1GCR01-BOW 存储器 LGA-8（深圳市安芯选电子），经手人李斯理',
      amount: 36.00,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: 'PC 透明亚克力螺丝 M3×5（50套）（佰瑞特官方旗舰店），经手人李斯理',
      amount: 6.20,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: 'PDS760-13（DIODES）（深圳市捷洲电子），经手人李斯理',
      amount: 4.20,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: '0805 电容 47µF/10V ×20（深圳市鑫隆发电子），经手人李斯理',
      amount: 5.00,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: '1206 电容 2.2µF/50V ×10（科迪电子），经手人李斯理',
      amount: 2.30,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '元器件/物料',
      desc: '双通六角尼龙柱 M3×14（50只）（力烁旗舰店），经手人李斯理',
      amount: 0.63,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '设备/工具',
      desc: '大尺寸锡膏台/钢网印刷台 PCB 90×84（暂未发货），经手人李斯理',
      amount: 65.00,
      voucher: '',
    },
    {
      date: '2026-09-19',
      type: 'expense',
      category: '其他',
      desc: '软件服务：Altium Designer 26 远程安装（proteus KEIL AD远程安装店），经手人李斯理',
      amount: 13.80,
      voucher: '',
    },

    // —— 第二批补购（2026-09-22 ~ 09-24，经手人李斯理）——
    {
      date: '2026-09-22',
      type: 'expense',
      category: '元器件/物料',
      desc: 'CM-K230 核心板 16G/1G 升级版（01Studio官方店，含运费），经手人李斯理',
      amount: 224.00,
      voucher: '',
    },
    {
      date: '2026-09-23',
      type: 'expense',
      category: '元器件/物料',
      desc: 'XH2.54 电子线端子线 4P-60MM 单头 5 条（音爪旗舰店），经手人李斯理',
      amount: 1.65,
      voucher: '',
    },
    {
      date: '2026-09-23',
      type: 'expense',
      category: '元器件/物料',
      desc: '微型纯铜散热片 12×12mm 紫铜 6MM 高 5片带背胶（简易散热，含运费），经手人李斯理',
      amount: 18.00,
      voucher: '',
    },
    {
      date: '2026-09-24',
      type: 'expense',
      category: '元器件/物料',
      desc: 'ESP32-S3FH4R2 QFN-56 Wi-Fi+蓝牙 SoC（深圳市铭昌兴微科技企业店，店铺仓库搬迁延迟发货），经手人李斯理',
      amount: 7.79,
      voucher: '',
    },

    // —— 退货退款（2026-09-23，经手人李斯理）——
    {
      date: '2026-09-23',
      type: 'income',
      category: '其他收入',
      desc: '退货退款：CM-K230 核心板 无/1G 低配版退货（01Studio官方店），经手人李斯理',
      amount: 139.00,
      voucher: '',
    },

    // —— 第三批采购（2026-09-28，经手人李斯理）——
    {
      date: '2026-09-28',
      type: 'expense',
      category: '设备/工具',
      desc: '手机维修锡膏 183℃ 中温有铅锡浆 50g + 杵针（凯利顺科技），经手人李斯理',
      amount: 31.65,
      voucher: '',
    },
    {
      date: '2026-09-28',
      type: 'expense',
      category: '设备/工具',
      desc: 'KE150 环保 BGA 助焊膏 10g 送杵针（凯利顺科技），经手人李斯理',
      amount: 11.50,
      voucher: '',
    },
    {
      date: '2026-09-28',
      type: 'expense',
      category: '元器件/物料',
      desc: 'K230 配套 MIPI 显示屏 3.5 寸 800×480 带电容触摸（01Studio官方店，含运费，已发货预计 10.1 送达），经手人李斯理',
      amount: 134.00,
      voucher: '',
    },
    {
      date: '2026-09-28',
      type: 'expense',
      category: '元器件/物料',
      desc: '0402 贴片电容本 80 种各 50 只（世和实业，待发货），经手人李斯理',
      amount: 32.00,
      voucher: '',
    },

    // —— 设备采购：热风枪（2026-09-25 下单，经手人李斯理）——
    {
      date: '2026-09-25',
      type: 'expense',
      category: '设备/工具',
      desc: '正点原子智能热风枪 H550 标配 6mm 直风嘴版（正点原子旗舰店，原价 278 实付 186.68，已签收），经手人李斯理',
      amount: 186.68,
      voucher: '',
    },

    // —— 第四批采购（2026-09-29 ~ 10-04，经手人李斯理）——
    {
      date: '2026-09-29',
      type: 'expense',
      category: '元器件/物料',
      desc: 'W25Q256JVEIQ WSON-8 闪存 ×3（意法世纪半导体），经手人李斯理',
      amount: 16.50,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '设备/工具',
      desc: 'SMT 激光钢网 ≤10×10cm 无框（宏扬 SMT 激光钢网），经手人李斯理',
      amount: 15.00,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '元器件/物料',
      desc: '0402 电容 10µF×50 + 100nF×100（YSUNK 旗舰店），经手人李斯理',
      amount: 9.50,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '元器件/物料',
      desc: '0402 高频电感 2NH + 1.3NH 各 100 个（CAICOS 旗舰店），经手人李斯理',
      amount: 3.00,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '设备/工具',
      desc: 'VETUS ST-11 超硬镊子 HRC40（旭日电子商城），经手人李斯理',
      amount: 13.50,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '元器件/物料',
      desc: '0402 电容 22µF 6.3V X5R ×20（迪林旗舰店），经手人李斯理',
      amount: 6.00,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '元器件/物料',
      desc: 'BTS7004-1EPP 高边开关 ×5（深圳篮信微科技），经手人李斯理',
      amount: 30.00,
      voucher: '',
    },
    {
      date: '2026-09-29',
      type: 'expense',
      category: '元器件/物料',
      desc: 'XC6220B331MR-G LDO ×5（深圳恒芯科创），经手人李斯理',
      amount: 6.50,
      voucher: '',
    },
    {
      date: '2026-09-30',
      type: 'expense',
      category: '设备/工具',
      desc: '吸锡带 2.5mm×1.5m 5 卷装（维修佬创立泰），经手人李斯理',
      amount: 19.90,
      voucher: '',
    },
    {
      date: '2026-09-30',
      type: 'expense',
      category: '元器件/物料',
      desc: '5G/5.8G IPEX 天线 ×4（risym 旗舰店），经手人李斯理',
      amount: 10.05,
      voucher: '',
    },
    {
      date: '2026-09-30',
      type: 'expense',
      category: '元器件/物料',
      desc: 'USB3.2 OTG 线 C 公 A 母 10Gbps（鹿易凡旗舰店），经手人李斯理',
      amount: 7.51,
      voucher: '',
    },
    {
      date: '2026-09-30',
      type: 'expense',
      category: '元器件/物料',
      desc: 'STM32H750IBK6 UFBGA-201 ×5（意法世纪半导体），经手人李斯理',
      amount: 90.00,
      voucher: '',
    },
    {
      date: '2026-10-02',
      type: 'expense',
      category: '设备/工具',
      desc: '贴片元件翻盖收纳盒 1# 蓝色 100 格拼装（日盛电子五金），经手人李斯理',
      amount: 48.00,
      voucher: '',
    },
    {
      date: '2026-10-02',
      type: 'expense',
      category: '元器件/物料',
      desc: 'CH334P QFN-16 USB2.0 Hub ×10 + CH343P USB 转串口 ×10（深圳市优信电子，已发货），经手人李斯理',
      amount: 51.55,
      voucher: '',
    },
    {
      date: '2026-10-02',
      type: 'expense',
      category: '元器件/物料',
      desc: 'YSO120TK 贴片有源晶振 YXC 3225 ×4（晶心微科技），经手人李斯理',
      amount: 6.80,
      voucher: '',
    },
    {
      date: '2026-10-02',
      type: 'expense',
      category: '元器件/物料',
      desc: 'GH1.25-6P 转杜邦母端子线 0.2m ×5 条（信容芯旗舰店），经手人李斯理',
      amount: 7.20,
      voucher: '',
    },
    {
      date: '2026-10-02',
      type: 'expense',
      category: '元器件/物料',
      desc: 'PH2.0-3P/30CM 电子线 ×5 + 1.25mm 立贴 3P 编带 ×10（优信电子），经手人李斯理',
      amount: 5.40,
      voucher: '',
    },
    {
      date: '2026-10-04',
      type: 'expense',
      category: '设备/工具',
      desc: '1000 万像素数码放大电子显微镜 5.5 寸屏/铝塑支架/充电款（锐界 AcuEdge），经手人李斯理',
      amount: 125.00,
      voucher: '',
    },

    // —— 第五批采购（2026-10-11）——
    {
      date: '2026-10-11',
      type: 'expense',
      category: '元器件/物料',
      desc: 'BD+GPS 二合一天线（北斗+GPS 双模，增益 28dBi，SMA 直公头内针，线长 1.5 米）×1（天猫·特加特数码专营店，买家已付款待发货），经手人刘艺',
      amount: 11.35,
      voucher: '',
    },

    // —— 日常支出（2026-10-12）——
    {
      date: '2026-10-12',
      type: 'expense',
      category: '其他',
      desc: '团队工作餐（采蝶轩），经手人李斯理、熊涛',
      amount: 97.00,
      voucher: '',
    },
    {
      date: '2026-10-12',
      type: 'expense',
      category: '其他',
      desc: '项目支出，经手人李斯理',
      amount: 600.00,
      voucher: '',
    },
    {
      date: '2026-10-12',
      type: 'expense',
      category: '其他',
      desc: 'Trae 积分购买，经手人李斯理',
      amount: 219.00,
      voucher: '',
    },
    {
      date: '2026-10-12',
      type: 'expense',
      category: '设备/工具',
      desc: '正点原子 USB 测试仪 C0 ×1，经手人李斯理',
      amount: 59.20,
      voucher: '',
    },
    {
      date: '2026-10-12',
      type: 'expense',
      category: '元器件/物料',
      desc: '闪迪 U3 高速 TF 卡 256G（国行正品 V30 红金卡）×1，经手人李斯理',
      amount: 296.99,
      voucher: '',
    },

    // —— 芯片/模块/连接器合单（2026-10-13，经手人李斯理）——
    {
      date: '2026-10-13',
      type: 'expense',
      category: '元器件/物料',
      desc: 'TPS54560DDAR TI 降压 DC-DC SOIC-8 ×6，经手人李斯理',
      amount: 27.84,
      voucher: '',
    },
    {
      date: '2026-10-13',
      type: 'expense',
      category: '元器件/物料',
      desc: 'SN74LVC1T45DBVR SOT-23 电平转换芯片 ×10，经手人李斯理',
      amount: 3.50,
      voucher: '',
    },
    {
      date: '2026-10-13',
      type: 'expense',
      category: '元器件/物料',
      desc: 'MAX485ESA UMW/友台 SOP-8 通信芯片 ×5，经手人李斯理',
      amount: 14.60,
      voucher: '',
    },
    {
      date: '2026-10-13',
      type: 'expense',
      category: '元器件/物料',
      desc: 'ESPC5-32E-H4 双频 WiFi6+蓝牙模块 ×5，经手人李斯理',
      amount: 86.20,
      voucher: '',
    },
    {
      date: '2026-10-13',
      type: 'expense',
      category: '元器件/物料',
      desc: 'XT30PW-F 母头连接器 ×5，经手人李斯理',
      amount: 7.20,
      voucher: '',
    },
    {
      date: '2026-10-13',
      type: 'expense',
      category: '元器件/物料',
      desc: 'XT30PW-M 公头连接器 ×5，经手人李斯理',
      amount: 7.20,
      voucher: '',
    },

    // —— 新增记录请复制下面这一行（不要复制本行注释和下面那行注释），改好后粘到上面列表里 ——
    // { date: '2026-10-01', type: 'expense', category: '元器件/物料', desc: '摘要写这里', amount: 100, voucher: '' },

  ],
};
