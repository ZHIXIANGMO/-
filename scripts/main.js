const app = Vue.createApp({
  data() {
    return {
      // 基础图形选择
      shapes: [
        { id: "circle", name: "圆形" },
        { id: "square", name: "方形" },
        { id: "triangle", name: "三角形" },
        { id: "hexagon", name: "六边形" },
        { id: "diamond", name: "菱形" },
      ],
      selectedShape: "circle",

      // 布局控制
      count: 100,
      spacingX: 50,
      spacingY: 50,
      distribution: "grid",

      // 样式设置
      size: 30,
      rotation: 0,
      color: "#2F80ED",
      opacity: 100,

      // 预览控制
      zoomLevel: 100,

      // 画布实例
      ctx: null,

      // 画布尺寸
      canvasWidth: 800,
      canvasHeight: 600,

      // 添加大小渐变相关的数据
      sizeGradient: false,
      minSizeRatio: 0.2,
      gradientDirection: "center-out",
    };
  },
  mounted() {
    const canvas = this.$refs.canvas;
    // 设置初始画布尺寸
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.ctx = canvas.getContext("2d");
    this.draw();

    // 更新状态栏
    this.updateStatusBar();

    // 监听所有可能影响绘制的属性变化
    this.$watch(
      () => [
        this.selectedShape,
        this.count,
        this.spacingX,
        this.spacingY,
        this.distribution,
        this.size,
        this.rotation,
        this.color,
        this.opacity,
        this.sizeGradient,
        this.minSizeRatio,
        this.gradientDirection,
      ],
      () => this.draw(),
      { deep: true }
    );
  },
  methods: {
    draw() {
      // 清空画布
      this.ctx.clearRect(
        0,
        0,
        this.$refs.canvas.width,
        this.$refs.canvas.height
      );

      // 根据分布模式绘制
      switch (this.distribution) {
        case "grid":
          this.drawGrid();
          break;
        case "random":
          this.drawRandom();
          break;
        case "circle":
          this.drawCircular();
          break;
      }
    },

    drawGrid() {
      const cols = Math.ceil(Math.sqrt(this.count));
      const rows = Math.ceil(this.count / cols);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * this.spacingX + this.spacingX / 2;
          const y = row * this.spacingY + this.spacingY / 2;
          let sizeRatio = 1;
          if (this.sizeGradient) {
            const gradientRatio = this.calculateGradientRatio(
              x,
              y,
              this.$refs.canvas.width,
              this.$refs.canvas.height
            );
            sizeRatio = gradientRatio;
          }
          this.drawShape(x, y, sizeRatio);
        }
      }
    },

    drawRandom() {
      for (let i = 0; i < this.count; i++) {
        const x = Math.random() * this.$refs.canvas.width;
        const y = Math.random() * this.$refs.canvas.height;
        let sizeRatio = 1;
        if (this.sizeGradient) {
          const gradientRatio = this.calculateGradientRatio(
            x,
            y,
            this.$refs.canvas.width,
            this.$refs.canvas.height
          );
          sizeRatio = gradientRatio;
        }
        this.drawShape(x, y, sizeRatio);
      }
    },

    drawCircular() {
      const centerX = this.$refs.canvas.width / 2;
      const centerY = this.$refs.canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;

      for (let i = 0; i < this.count; i++) {
        const angle = (i / this.count) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        let sizeRatio = 1;
        if (this.sizeGradient) {
          const gradientRatio = this.calculateGradientRatio(
            x,
            y,
            this.$refs.canvas.width,
            this.$refs.canvas.height
          );
          sizeRatio = gradientRatio;
        }
        this.drawShape(x, y, sizeRatio);
      }
    },

    drawShape(x, y, sizeRatio = 1) {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate((this.rotation * Math.PI) / 180);

      // 计算实际大小
      // 确保 minSizeRatio 是数值类型
      const minRatio = parseFloat(this.minSizeRatio);
      let currentSize = this.size;

      if (this.sizeGradient) {
        // 计算大小范围
        const maxSize = this.size;
        const minSize = this.size * minRatio;
        // 使用渐变比例在最小和最大大小之间插值
        currentSize = minSize + (maxSize - minSize) * sizeRatio;
      }

      this.ctx.fillStyle =
        this.color +
        Math.floor(this.opacity * 2.55)
          .toString(16)
          .padStart(2, "0");
      this.ctx.beginPath();

      switch (this.selectedShape) {
        case "circle":
          this.ctx.arc(0, 0, currentSize / 2, 0, Math.PI * 2);
          break;
        case "square":
          this.ctx.rect(
            -currentSize / 2,
            -currentSize / 2,
            currentSize,
            currentSize
          );
          break;
        case "triangle":
          this.ctx.moveTo(0, -currentSize / 2);
          this.ctx.lineTo(currentSize / 2, currentSize / 2);
          this.ctx.lineTo(-currentSize / 2, currentSize / 2);
          break;
        case "hexagon":
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = (Math.cos(angle) * currentSize) / 2;
            const py = (Math.sin(angle) * currentSize) / 2;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
          }
          break;
        case "diamond":
          this.ctx.moveTo(0, -currentSize / 2);
          this.ctx.lineTo(currentSize / 2, 0);
          this.ctx.lineTo(0, currentSize / 2);
          this.ctx.lineTo(-currentSize / 2, 0);
          break;
      }

      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    },

    // 预览控制方法
    zoomIn() {
      this.zoomLevel = Math.min(400, this.zoomLevel + 10);
      this.updateZoom();
    },

    zoomOut() {
      this.zoomLevel = Math.max(50, this.zoomLevel - 10);
      this.updateZoom();
    },

    resetZoom() {
      this.zoomLevel = 100;
      this.updateZoom();
    },

    updateZoom() {
      const canvas = this.$refs.canvas;
      canvas.style.transform = `scale(${this.zoomLevel / 100})`;
    },

    // 导出方法
    exportAsPNG() {
      const canvas = this.$refs.canvas;
      const link = document.createElement("a");
      link.download = "pattern.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    },

    exportAsSVG() {
      // SVG导出逻辑待实现
      alert("SVG导出功能开发中");
    },

    savePreset() {
      // 预设保存逻辑待实现
      alert("预设保存功能开发中");
    },

    // 添加 selectShape 方法
    selectShape(shapeId) {
      this.selectedShape = shapeId;
    },

    // 更新画布尺寸
    updateCanvasSize() {
      const canvas = this.$refs.canvas;
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;

      // 更新状态栏显示
      this.updateStatusBar();

      // 重新绘制
      this.draw();
    },

    // 设置预设画布尺寸
    setCanvasSize(width, height) {
      this.canvasWidth = width;
      this.canvasHeight = height;
      this.updateCanvasSize();
    },

    // 更新状态栏
    updateStatusBar() {
      // 在状态栏中更新画布尺寸显示
      const statusBar = document.querySelector(".canvas-size");
      if (statusBar) {
        statusBar.textContent = `画布: ${this.canvasWidth} × ${this.canvasHeight}`;
      }
    },

    // 计算渐变比例的方法
    calculateGradientRatio(x, y, width, height) {
      // 确保返回值在 0-1 范围内
      const clamp = (value) => Math.max(0, Math.min(1, value));

      switch (this.gradientDirection) {
        case "center-out": {
          const centerX = width / 2;
          const centerY = height / 2;
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          const dist = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          return clamp(dist / maxDist);
        }
        case "out-center": {
          const centerX = width / 2;
          const centerY = height / 2;
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          const dist = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          return clamp(1 - dist / maxDist);
        }
        case "left-right":
          return clamp(x / width);
        case "right-left":
          return clamp(1 - x / width);
        case "top-bottom":
          return clamp(y / height);
        case "bottom-top":
          return clamp(1 - y / height);
        default:
          return 1;
      }
    },
  },
}).mount("#app");
