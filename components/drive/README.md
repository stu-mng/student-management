# Drive 组件 - FilePreviewContent 集成

## 概述

Drive 页面现在已经完全集成了 `FilePreviewContent` 组件，提供了多种文件预览方式：

1. **内联快速预览** - 在文件列表中直接预览文件
2. **完整预览模态框** - 全屏预览体验
3. **文件类型识别** - 自动识别并显示适当的预览内容

## 组件结构

### 主要组件

- `FileItem` - 文件列表项，包含快速预览功能
- `InlinePreview` - 内联预览组件，使用 `FilePreviewContent`
- `FilePreview` - 完整预览模态框，也使用 `FilePreviewContent`

### 预览功能

#### 1. 内联快速预览

在文件列表中，每个文件都有两个预览按钮：
- **快速预览** - 使用 `InlinePreview` 组件，提供快速的文件预览
- **完整预览** - 使用 `FilePreview` 组件，提供全屏预览体验

#### 2. 支持的文件类型

- **图片文件** - 直接显示图片
- **PDF 文件** - 使用 Google Drive 预览
- **Google 文档** - 支持文档、试算表、简报表
- **文本文件** - 支持 Markdown 和其他文本格式
- **音视频文件** - 支持播放
- **压缩文件** - 显示文件信息

## 使用方法

### 在 FileItem 中使用

```tsx
import { InlinePreview } from '@/components/drive'

// 在 FileItem 组件中
const [showInlinePreview, setShowInlinePreview] = useState(false)

// 渲染内联预览
<InlinePreview
  file={file}
  isOpen={showInlinePreview}
  onClose={() => setShowInlinePreview(false)}
  onDownload={onDownload}
/>
```

### 预览按钮

```tsx
// 快速预览按钮
<Button
  onClick={handleInlinePreview}
  title="快速預覽"
>
  <Eye className="h-4 w-4" />
  快速預覽
</Button>

// 完整预览按钮
<Button
  onClick={() => onPreview(file)}
  title="完整預覽"
>
  <Eye className="h-4 w-4" />
  完整預覽
</Button>
```

## 特性

### 1. 响应式设计

- 支持列表视图和网格视图
- 自适应不同屏幕尺寸
- 移动端友好的触摸操作

### 2. 用户体验

- 快速预览无需离开当前页面
- 支持键盘快捷键操作
- 平滑的动画过渡效果

### 3. 性能优化

- 懒加载预览内容
- 智能缓存机制
- 错误处理和重试功能

## 自定义

### 样式定制

可以通过 `className` 属性自定义预览组件的样式：

```tsx
<InlinePreview
  file={file}
  isOpen={showInlinePreview}
  onClose={handleClose}
  onDownload={onDownload}
  className="custom-preview-styles"
/>
```

### 功能扩展

可以扩展 `InlinePreview` 组件来添加更多功能：

- 文件评论系统
- 协作编辑功能
- 版本历史查看
- 权限管理

## 技术实现

### 核心依赖

- `FilePreviewContent` - 主要的预览内容组件
- `cn` 工具函数 - 用于条件类名组合
- Tailwind CSS - 样式系统
- Lucide React - 图标库

### 状态管理

使用 React hooks 管理预览状态：

```tsx
const [showInlinePreview, setShowInlinePreview] = useState(false)
const [isRefreshing, setIsRefreshing] = useState(false)
```

### 事件处理

- 阻止事件冒泡
- 支持键盘导航
- 触摸手势支持

## 最佳实践

### 1. 性能考虑

- 避免在预览中加载过大的文件
- 使用适当的加载状态指示器
- 实现错误边界处理

### 2. 可访问性

- 提供适当的 ARIA 标签
- 支持键盘导航
- 屏幕阅读器友好

### 3. 错误处理

- 优雅降级处理
- 用户友好的错误消息
- 重试机制

## 未来改进

### 计划功能

- [ ] 批量预览支持
- [ ] 预览历史记录
- [ ] 自定义预览布局
- [ ] 高级搜索和过滤

### 技术优化

- [ ] 虚拟滚动支持
- [ ] 更智能的缓存策略
- [ ] 离线预览支持
- [ ] 性能监控和优化

## 总结

通过集成 `FilePreviewContent` 组件，Drive 页面现在提供了强大而灵活的文件预览功能。用户可以在不离开当前页面的情况下快速预览文件，同时还可以选择全屏预览以获得更好的查看体验。这种集成方式既保持了代码的模块化，又提供了丰富的用户体验。
