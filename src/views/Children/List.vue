<template>
  <div v-loading.fullscreen.lock="fullscreenLoading">
    <el-row>
      <el-col >
        <el-select
          v-model="upForm.repos"
          placeholder="请选择仓库"
          @change="selectRepos"
        >
          <el-option
            v-for="(v, i) in reposList"
            :key="i"
            :label="v.name"
            :value="v.name"
          >
          </el-option>
        </el-select>
        <el-select v-model="upForm.content" placeholder="请选择目录">
          <el-option
            v-for="(v, i) in reposContents"
            :key="i"
            :label="v.name"
            :value="v.val"
          >
          </el-option>
        </el-select>
        <el-button @click="getList" type="primary">获取列表</el-button>
      </el-col>
    </el-row>
    <el-row style="padding-top: 20px">
      <el-col class="imgerr">
        
        <!-- <span>图片加载不出来？</span> -->
        <el-tag type="success">BaseUrl：{{ isjsDeliver ? 'jsDeliver' : 'Github' }}</el-tag>
        <el-button @click="isjsDeliver = !isjsDeliver" size="mini" type="success"
          class="switchUrl"
          >切换</el-button
        >
      </el-col>
      <el-col>
        <div class="item" v-for="(v, i) in dataList" :key="i">
          <div class="del" @click="delFile(v)">
            <i class="el-icon-delete"></i>
          </div>
          <el-image
            @click="opDia(imgurl + v.path)"
            class="list-img"
            :src="isjsDeliver ? imgurl + v.path : v.download_url"
            fit="cover"
            lazy
          ></el-image>
          <div class="file-name" :title="v.name">{{ v.name.length > 20 ? v.name.slice(0, 20) + '...' : v.name }}</div>
          <div class="btn-group">
            <el-tooltip content="复制外链" placement="top">
              <el-button size="mini" icon="el-icon-link" @click="copy(1, imgurl + v.path)" circle></el-button>
            </el-tooltip>
            <el-tooltip content="复制MD格式" placement="top">
              <el-button size="mini" icon="el-icon-document-copy" @click="copy(2, imgurl + v.path)" circle></el-button>
            </el-tooltip>
          </div>
        </div>
      </el-col>
    </el-row>
    <div class="dialog" ref="dialog" v-if="dialogTableVisible" @click="diaClose" @wheel="onWheel">
      <div class="dialog-close" @click.stop="diaClose">
        <i class="el-icon-circle-close"></i>
      </div>
      <div class="dialog-toolbar" @click.stop>
        <el-button icon="el-icon-zoom-in" @click="zoomIn" circle size="mini"></el-button>
        <el-button icon="el-icon-zoom-out" @click="zoomOut" circle size="mini"></el-button>
        <el-button icon="el-icon-refresh-right" @click="zoomReset" circle size="mini"></el-button>
      </div>
      <img
        class="diaimg"
        :class="{ 'diaimg-smooth': !isDragging && !isPinching, 'diaimg-direct': isDragging || isPinching }"
        :src="dialogUrl"
        @click.stop
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @dblclick="onDblClick"
        :style="{ transform: 'translate(' + dialogX + 'px, ' + dialogY + 'px) scale(' + dialogScale + ')', cursor: dialogScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }"
      />
    </div>
  </div>
</template>

<script>
import { getUserRepos, getReposContents } from "@/api/user";
import { getFileList, delFile } from "@/api/list";
export default {
  data() {
    return {
      dialogTableVisible: false,
      fullscreenLoading: false,
      dialogUrl: "",
      repoData: {},
      userInfo: {},
      reposList: [],
      reposContents: [],
      dataList: [],
      upForm: {
        repos: "",
        content: "",
      },
      imgurl: "",
      isjsDeliver: false,
      sign:"",
      dialogScale: 1,
      dialogX: 0,
      dialogY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      isPinching: false,
      pinchStartDist: 0,
      pinchStartScale: 1,
    };
  },
  created() {
    this.repoData = this.$store.state.uploadInfo;
    this.userInfo = this.$store.state.userInfo;
     this.sign = this.$store.state.sign;
    this.defSelect();
  },
  methods: {
    opDia(v) {
      this.dialogTableVisible = true;
      this.dialogUrl = v;
      this.dialogScale = 1;
      this.dialogX = 0;
      this.dialogY = 0;
      this.isDragging = false;
      this.isPinching = false;
    },
    diaClose() {
      this.dialogTableVisible = false;
      this.dialogUrl = "";
      this.dialogScale = 1;
      this.dialogX = 0;
      this.dialogY = 0;
      this.isDragging = false;
      this.isPinching = false;
    },
    zoomIn() {
      this.dialogScale = Math.min(5, this.dialogScale + 0.2);
    },
    zoomOut() {
      var s = Math.max(0.5, this.dialogScale - 0.2);
      this.dialogScale = s;
      if (s <= 1) { this.dialogX = 0; this.dialogY = 0; }
    },
    zoomReset() {
      this.dialogScale = 1;
      this.dialogX = 0;
      this.dialogY = 0;
    },
    // 鼠标拖拽
    startDrag(e) {
      if (this.dialogScale <= 1) return;
      this.isDragging = true;
      this.dragStartX = e.clientX - this.dialogX;
      this.dragStartY = e.clientY - this.dialogY;
    },
    onDrag(e) {
      if (!this.isDragging) return;
      e.preventDefault();
      this.dialogX = e.clientX - this.dragStartX;
      this.dialogY = e.clientY - this.dragStartY;
    },
    endDrag() {
      this.isDragging = false;
    },
    // 滚轮缩放（以鼠标位置为中心）
    onWheel(e) {
      e.preventDefault();
      var el = this.$refs.dialog;
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var cx = e.clientX - rect.left - rect.width / 2;
      var cy = e.clientY - rect.top - rect.height / 2;
      var oldScale = this.dialogScale;
      var delta = e.deltaY < 0 ? 0.15 : -0.15;
      var newScale = Math.max(0.5, Math.min(5, oldScale + delta));
      var ratio = newScale / oldScale;
      this.dialogX = cx - (cx - this.dialogX) * ratio;
      this.dialogY = cy - (cy - this.dialogY) * ratio;
      this.dialogScale = newScale;
      if (newScale <= 1) { this.dialogX = 0; this.dialogY = 0; }
    },
    // 双击切换缩放
    onDblClick(e) {
      if (this.dialogScale > 1) {
        this.dialogScale = 1;
        this.dialogX = 0;
        this.dialogY = 0;
      } else {
        var el = this.$refs.dialog;
        if (el) {
          var rect = el.getBoundingClientRect();
          var cx = e.clientX - rect.left - rect.width / 2;
          var cy = e.clientY - rect.top - rect.height / 2;
          this.dialogScale = 2.5;
          this.dialogX = cx - cx * 2.5;
          this.dialogY = cy - cy * 2.5;
        } else {
          this.dialogScale = 2.5;
        }
      }
    },
    // 触摸事件
    onTouchStart(e) {
      if (e.touches.length === 1) {
        if (this.dialogScale > 1) {
          this.isDragging = true;
          var t = e.touches[0];
          this.dragStartX = t.clientX - this.dialogX;
          this.dragStartY = t.clientY - this.dialogY;
        }
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        this.isPinching = true;
        this.pinchStartDist = this.getTouchDist(e.touches);
        this.pinchStartScale = this.dialogScale;
      }
    },
    onTouchMove(e) {
      if (this.isPinching && e.touches.length === 2) {
        e.preventDefault();
        var dist = this.getTouchDist(e.touches);
        var scale = this.pinchStartScale * (dist / this.pinchStartDist);
        this.dialogScale = Math.max(0.5, Math.min(5, scale));
        if (this.dialogScale <= 1) { this.dialogX = 0; this.dialogY = 0; }
      } else if (this.isDragging && e.touches.length === 1) {
        e.preventDefault();
        var t = e.touches[0];
        this.dialogX = t.clientX - this.dragStartX;
        this.dialogY = t.clientY - this.dragStartY;
      }
    },
    onTouchEnd(e) {
      if (e.touches.length === 0) {
        this.isDragging = false;
        this.isPinching = false;
      } else if (e.touches.length === 1 && this.isPinching) {
        this.isPinching = false;
        if (this.dialogScale > 1) {
          var t = e.touches[0];
          this.dragStartX = t.clientX - this.dialogX;
          this.dragStartY = t.clientY - this.dialogY;
          this.isDragging = true;
        }
      }
    },
    getTouchDist(touches) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
    // 默认选中操作
    defSelect() {
      this.getRepos(this.userInfo.login);
      this.selectRepos(this.$store.state.uploadInfo.repos);
      this.upForm.repos = this.$store.state.uploadInfo.repos;
      this.upForm.content = this.$store.state.uploadInfo.content;
      if(this.$store.state.uploadInfo.iscant){
         this.upForm.content = this.$store.state.uploadInfo.delimit;
      }
      this.getList();
    },
    // 获取用户仓库
    getRepos(name) {
      this.fullscreenLoading = true;
      getUserRepos(name)
        .then((res) => {
          this.reposList = res;
          this.fullscreenLoading = false;
        })
        .catch((err) => {
          console.log(err);
          this.fullscreenLoading = false;
        });
    },
    // 获取目录
    selectRepos(v) {
      if (!v) return;
      this.fullscreenLoading = true;
      this.upForm.content = "";
      getReposContents(this.userInfo.login, v)
        .then((res) => {
          let data = [];
          res.forEach((v) => {
            if (v.type == "dir") {
              data.push({
                name: v.name,
                val: "/" + v.path,
              });
            }
          });
          this.reposContents = data;
          this.fullscreenLoading = false;
        })
        .catch((err) => {
          console.log(err);
          this.fullscreenLoading = false;
        });
    },
    // 搜索按钮
    getList() {
      if (
        this.userInfo.login == "" ||
        this.upForm.repos == "" ||
        this.upForm.content == "" ||
        !this.userInfo.login ||
        !this.upForm.repos ||
        !this.upForm.content
      ) {
        this.$message.info("请选择仓库和目录");
        return;
      }
      this.fullscreenLoading = true;
      this.imgurl = `https://cdn.jsdelivr.net/gh/${this.userInfo.login}/${this.upForm.repos}/`;
      getFileList(this.userInfo.login, this.upForm.repos, this.upForm.content)
        .then((res) => {
          this.dataList = res;
          this.fullscreenLoading = false;
        })
        .catch((err) => {
          console.log(err);
          this.fullscreenLoading = false;
        });
    },
    // 复制内容
    copy(type, val) {
      // type 1 link  2 MD
      let copyCont = "";
      if (type == 1) {
        copyCont = val;
      } else {
        copyCont = `![${this.sign}](${val})`;
      }
      let oInput = document.createElement("input");
      oInput.value = copyCont;
      document.body.appendChild(oInput);
      oInput.select();
      document.execCommand("Copy");
      this.$message({
        message: "复制成功",
        type: "success",
      });
      oInput.remove();
    },
    // 删除文件
    delFile(v) {
      this.$confirm("此操作将永久删除该文件, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          let data = {
            message: "delete a file via wishimgurl",
            sha: v.sha,
          };
          this.fullscreenLoading = true;
          delFile(this.userInfo.login, this.upForm.repos, v.path, data)
            .then((res) => {
              console.log(res);
              this.$message.success("删除成功");
              this.getList();
              this.fullscreenLoading = false;
            })
            .catch((err) => {
              console.log(err);
              this.fullscreenLoading = false;
            });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
  },
};
</script>

<style scoped>
.item {
  width: 200px;
  display: inline-block;
  padding: 5px;
  text-align: center;
  box-shadow: 0 0 1px 0;
  position: relative;
}
.list-img {
  width: 100%;
  height: 200px;
  cursor: pointer;
}
.file-name {
  font-size: 12px;
  color: #666;
  padding: 4px 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-group {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 2px;
}
.imgerr {
  text-align: right;
  padding-bottom: 20px;
}
.item .del {
  display: none;
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 999999999;
  cursor: pointer;
  border: 1px solid #ccc;
  background: #ccc;
}
.item:hover .del {
  display: block;
}
.dialog {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.9);
  overflow: auto;
  touch-action: pinch-zoom;
  z-index: 9999;
}
.dialog-close {
  font-size: 40px;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}
.dialog-toolbar {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 2;
  display: flex;
  gap: 8px;
}
.el-icon-circle-close {
  cursor: pointer;
}
.diaimg {
  max-width: 85%;
  max-height: 85vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}
.diaimg-smooth {
  transition: transform 0.25s ease-out;
}
.diaimg-direct {
  transition: none;
}
.switchUrl {
  margin-left: 20px;
}
@media (max-width: 768px) {
  .item {
    width: calc(50% - 10px);
  }
  .el-select {
    width: 100%;
    margin-bottom: 5px;
  }
  .switchUrl {
    margin-left: 0;
  }
  .imgerr {
    text-align: left;
  }
}
</style>