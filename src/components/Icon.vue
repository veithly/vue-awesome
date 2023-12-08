<script lang="jsx">
import * as Vue from 'vue'
let icons = {}

function warn(msg, vm) {
  if (!vm) {
    /* eslint-disable no-console */
    console.error(msg)
    /* eslint-enable no-console */
    return
  }
  vm.constructor.super.util.warn(msg, vm)
}

function $children(instance) {
  function $walk(vnode, children) {
    if (vnode.component && vnode.component.proxy) {
      children.push(vnode.component.proxy)
    } else if (vnode.shapeFlag & (1 << 4)) {
      const vnodes = vnode.children
      for (let i = 0; i < vnodes.length; i++) {
        $walk(vnodes[i], children)
      }
    }
  }
  const root = instance.$.subTree
  const children = []
  if (root) {
    $walk(root, children)
  }
  return children
}

export default {
  name: 'fa-icon',
  props: {
    name: {
      type: String,
      validator(val) {
        if (val && !(val in icons)) {
          warn(
            `Invalid prop: prop "name" is referring to an unregistered icon "${val}".\n` +
              `Please make sure you have imported this icon before using it.`,
            this
          )
          return false
        }
        return true
      },
    },
    title: String,
    scale: [Number, String],
    spin: Boolean,
    inverse: Boolean,
    pulse: Boolean,
    flip: {
      validator(val) {
        return val === 'horizontal' || val === 'vertical' || val === 'both'
      },
    },
    label: String,
    tabindex: [Number, String],
  },
  data() {
    return {
      x: 0,
      y: 0,
      childrenWidth: 0,
      childrenHeight: 0,
      outerScale: 1,
      classes: {},
    }
  },
  computed: {
    $listeners() {
      return this.$attrs
    },
    normalizedScale() {
      let scale = this.scale
      scale = typeof scale === 'undefined' ? 1 : Number(scale)
      if (isNaN(scale) || scale <= 0) {
        warn(`Invalid prop: prop "scale" should be a number over 0.`, this)
        return this.outerScale
      }
      return scale * this.outerScale
    },
    klass() {
      let classes = {
        'fa-icon': true,
        'fa-spin': this.spin,
        'fa-flip-horizontal': this.flip === 'horizontal',
        'fa-flip-vertical': this.flip === 'vertical',
        'fa-flip-both': this.flip === 'both',
        'fa-inverse': this.inverse,
        'fa-pulse': this.pulse,
      }
      let classList = ""
      if (this.classes) {
        Object.keys(this.classes).forEach((c) => {
          if (this.classes[c]) {
            classes[c] = true
          }
        })
      }
      Object.keys(classes).forEach((c) => {
        if (classes[c]) {
          classList += c + " "
        }
      })
      return classList
    },
    icon() {
      if (this.name) {
        return icons[this.name]
      }
      return null
    },
    box() {
      if (this.icon) {
        return `0 0 ${this.icon.width} ${this.icon.height}`
      }
      return `0 0 ${this.width} ${this.height}`
    },
    ratio() {
      if (!this.icon) {
        return 1
      }
      let { width, height } = this.icon
      return Math.max(width, height) / 16
    },
    width() {
      return (
        this.childrenWidth ||
        (this.icon && (this.icon.width / this.ratio) * this.normalizedScale) ||
        0
      )
    },
    height() {
      return (
        this.childrenHeight ||
        (this.icon && (this.icon.height / this.ratio) * this.normalizedScale) ||
        0
      )
    },
    style() {
      if (this.normalizedScale === 1) {
        return false
      }
      return {
        fontSize: this.normalizedScale + 'em',
      }
    },
    raw() {
      // generate unique id for each icon's SVG element with ID
      if (!this.icon || !this.icon.raw) {
        return null
      }
      let raw = this.icon.raw
      let ids = {}
      raw = raw.replace(
        /\s(?:xml:)?id=(["']?)([^"')\s]+)\1/g,
        (match, quote, id) => {
          let uniqueId = getId('vat-')
          ids[id] = uniqueId
          return ` id="${uniqueId}"`
        }
      )
      raw = raw.replace(
        /#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g,
        (match, rawId, _, pointerId) => {
          let id = rawId || pointerId
          if (!id || !ids[id]) {
            return match
          }

          return `#${ids[id]}`
        }
      )

      return raw
    },
    focusable() {
      let { tabindex } = this
      if (tabindex == null) {
        return 'false'
      }
      let index =
        typeof tabindex === 'string' ? parseInt(tabindex, 10) : tabindex
      if (index >= 0) {
        return null
      }
      return 'false'
    },
  },
  mounted() {
    this.updateStack()
  },
  updated() {
    this.updateStack()
  },
  methods: {
    updateStack() {
      if (!this.name && this.name !== null && $children(this).length === 0) {
        warn(`Invalid prop: prop "name" is required.`, this)
        return
      }

      if (this.icon) {
        return
      }

      let width = 0
      let height = 0
      $children(this).forEach((child) => {
        child.outerScale = this.normalizedScale

        width = Math.max(width, child.width)
        height = Math.max(height, child.height)
      })
      this.childrenWidth = width
      this.childrenHeight = height
      $children(this).forEach((child) => {
        child.x = (width - child.width) / 2
        child.y = (height - child.height) / 2
      })
    },
  },
  render() {
    if (this.name === null) {
      return Vue.h()
    }

    let options = {
      class: this.klass,
      style: this.style,
      role: this.$attrs.role || (this.label || this.title ? 'img' : null),
      'aria-label': this.label || null,
      'aria-hidden': !(this.label || this.title),
      tabindex: this.tabindex,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      viewBox: this.box,
      focusable: this.focusable,
    }

    if (this.$listeners['class']) {
      options.class = options.class + " " + this.$listeners['class']
    }

    if (this.$listeners['style']) {
      options.style = Object.assign({}, options.style, this.$listeners['style'])
    }

    if (this.raw) {
      let html = `<g>${this.raw}</g>`

      if (this.title) {
        html = `<title>${escapeHTML(this.title)}</title>${html}`
      }

      options.domProps = { innerHTML: html }
    }

    let content = this.title ? [Vue.h('title', this.title)] : []

    return Vue.h(
      'svg',
      options,
      this.raw
        ? null
        : content.concat([
            Vue.h(
              'g',
              (this.$slots.default && this.$slots.default()) ||
                (this.icon
                  ? [
                      ...this.icon.paths.map((path, i) =>
                        Vue.h('path', {
                          attrs: path,
                          key: `path-${i}`,
                        })
                      ),
                      ...this.icon.polygons.map((polygon, i) =>
                        Vue.h('polygon', {
                          attrs: polygon,
                          key: `polygon-${i}`,
                        })
                      ),
                    ]
                  : [])
            ),
          ])
    )
  },
  register(data) {
    for (let name in data) {
      let icon = data[name]
      let { paths = [], d, polygons = [], points } = icon

      if (d) {
        paths.push({ d })
      }

      if (points) {
        polygons.push({ points })
      }

      icons[name] = assign({}, icon, {
        paths,
        polygons,
      })
    }
  },
  icons,
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function assign(obj, ...sources) {
  sources.forEach((source) => {
    for (let key in source) {
      if (hasOwn(source, key)) {
        obj[key] = source[key]
      }
    }
  })

  return obj
}

let count = 0
function getId(prefix = '') {
  return prefix + count++
}

const ESCAPE_MAP = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '&': '&amp;',
}

function escapeHTML(html) {
  return html.replace(/[<>"&]/g, (c) => ESCAPE_MAP[c] || c)
}
</script>

<style>
.fa-icon {
  display: inline-block;
  fill: currentColor;
  overflow: visible;
  vertical-align: -0.125em;
}

.fa-icon > g {
  transform-origin: 50% 50%;
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both {
  transform: scale(-1, -1);
}

.fa-spin > g {
  animation: fa-spin 1s 0s infinite linear;
}

.fa-pulse > g {
  animation: fa-spin 1s infinite steps(8);
}

.fa-inverse {
  color: #fff;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
