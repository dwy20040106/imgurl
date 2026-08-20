<template>
  <el-container>
    <el-header class="header-info">
      <div class="toggle-btn" @click="toggleSidebar">
        <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
      </div>
      <div class="item active">基于Github的图床</div>
      <el-divider direction="vertical"></el-divider>
      <div class="item">
        <a target="_black" href="https://wishmelz.github.io/imgur">基于imgur的图床</a>
      </div>
    </el-header>
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar-aside">
        <el-menu
          :collapse="isCollapse"
          default-active="2"
          class="el-menu-vertical-demo"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          router
        >
          <el-menu-item index="user">
            <i class="el-icon-setting"></i>
            <span slot="title">配置</span>
          </el-menu-item>
          <el-menu-item index="upload">
            <i class="el-icon-upload"></i>
            <span slot="title">上传</span>
          </el-menu-item>
          <el-menu-item index="list">
            <i class="el-icon-more"></i>
            <span slot="title">列表</span>
          </el-menu-item>
          <el-menu-item index="/">
            <i class="el-icon-s-opportunity"></i>
            <span slot="title">教程</span>
          </el-menu-item>
          <el-menu-item @click="closeToken">
            <i class="el-icon-error"></i>
            <span slot="title">清除Token(退出)</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-main>
          <router-view />
        </el-main>
        <el-footer></el-footer>
      </el-container>
    </el-container>
  </el-container>
</template>

<script>
export default {
  data() {
    return {
      isCollapse: false
    };
  },
  mounted() {
    if (window.innerWidth <= 768) {
      this.isCollapse = true;
    }
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    toggleSidebar() {
      this.isCollapse = !this.isCollapse;
    },
    handleResize() {
      if (window.innerWidth <= 768) {
        this.isCollapse = true;
      }
    },
    closeToken() {
      localStorage.removeItem('vuex');
      this.$router.push("/");
    },
  },
};
</script>

<style>
section {
  height: 100%;
}
.el-aside {
  background: #555c63;
}
.el-header {
  background: #555c63;
}
.toggle-btn {
  cursor: pointer;
  font-size: 20px;
  color: #fff;
  margin-right: 15px;
  display: flex;
  align-items: center;
}
.header-info {
  line-height: 60px;
  text-align: center;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.header-info .item a {
  color: #eee;
  cursor: pointer;
}
.header-info .item a:hover {
  font-weight: bold;
}
.active {
  font-weight: bold;
  color: #fff;
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}
@media (max-width: 768px) {
  .header-info {
    padding: 0 10px;
  }
  .header-info .item {
    font-size: 12px;
  }
  .el-main {
    padding: 10px;
  }
}
</style>
