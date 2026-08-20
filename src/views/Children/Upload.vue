<template>
  <div id="upload" v-loading.fullscreen.lock="fullscreenLoading">
    <el-row>
      <el-col>
        <el-upload
          style="width: 100%"
          class="upload-demo"
          drag
          action="/"
          multiple
          :before-upload="befUpload"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__text"><b>支持 ctrl + v 上传</b></div>
        </el-upload>
      </el-col>
      <el-col style="padding-top: 20px">
        <div class="tag-group">
          <el-tag effect="dark">仓库：{{ upForm.repos }}</el-tag>
          <el-tag effect="dark" v-if="upForm.iscant"
            >目录：{{ upForm.delimit }}</el-tag
          >
          <el-tag effect="dark" v-else>目录：{{ upForm.content }}</el-tag>
           <el-input @input='signInput' placeholder="请输入签名" size='mini'  style="width:250px" v-model="sign">
              <template slot="prepend">签名</template>
           </el-input>
           <span style="vertical-align: sub;font-size:10px;font-style: italic;">签名就是 <b>![]</b> 中的字</span>
        </div>
      </el-col>
      <el-col style="padding-top: 30px">
        <el-radio v-model="nameType" label="1">使用源文件名字</el-radio>
        <el-radio v-model="nameType" label="2">使用加密文件名字</el-radio>
      </el-col>
    </el-row>

    <el-divider></el-divider>

    <el-row v-if="pendingFile" style="padding-top: 10px">
      <el-col :span="24" :md="12">
        <div class="preview-box">
          <img :src="pendingFile.preview" class="preview-img" />
        </div>
      </el-col>
      <el-col :span="24" :md="12" style="padding-top: 10px">
        <el-input v-model="customName" placeholder="请输入文件名（含后缀，如 abc.png）">
          <template slot="prepend">文件名</template>
        </el-input>
        <el-button
          type="primary"
          @click="confirmUpload"
          style="margin-top: 15px"
          >上传</el-button
        >
      </el-col>
    </el-row>

    <el-divider></el-divider>
    <el-row>
      <el-col :span="24" :md="16" class="resimg">
        <el-input v-model="resData[0]">
          <template slot="prepend">GitHub</template>
          <template slot="append">
            <el-button class="copy" @click="copy(resData[0])">复制</el-button>
          </template>
        </el-input>
        <el-input v-model="resData[1]">
          <template slot="prepend">jsDelivr</template>
          <template slot="append">
            <el-button class="copy" @click="copy(resData[1])">复制</el-button>
          </template>
        </el-input>
        <el-input v-model="resData[2]">
          <template slot="prepend">Markdown</template>
          <template slot="append">
            <el-button class="copy" @click="copy(resData[2])">复制</el-button>
          </template>
        </el-input>
        <el-tabs v-model="activeName" type="border-card" stretch>
          <el-tab-pane class="imgbox" label="GitHub预览" name="first">
            <el-image :src="resData[0]"></el-image>
          </el-tab-pane>
          <el-tab-pane class="imgbox" label="jsDelivr预览" name="second">
            <el-image :src="resData[1]"></el-image>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { upload } from "@/api/upload";
import md5 from "md5";
export default {
  data() {
    return {
      activeName: "first",
      fullscreenLoading: false,
      nameType: "2",
      upForm: {},
      userInfo: {},
      resUrl: "",
      resData: [],
      sign: "wishimg",
      pendingFile: null,
      customName: "",
    };
  },
  created() {
    this.userInfo = this.$store.state.userInfo;
    this.upForm = this.$store.state.uploadInfo;
    this.sign = this.$store.state.sign;
  },

  mounted() {
    let _this = this;
    document.addEventListener("paste", function (event) {
      if (event.clipboardData || event.originalEvent) {
        var clipboardData =
          event.clipboardData || event.originalEvent.clipboardData;
        if (clipboardData.items) {
          var items = clipboardData.items,
            len = items.length,
            blob = null;
          for (var i = 0; i < len; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              blob = items[i].getAsFile();
            }
          }
          if (blob !== null) {
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function (event) {
              var base64_str = event.target.result;
              _this.pendingFile = {
                originalName: "pasted.png",
                base64: base64_str.split(",")[1],
                preview: base64_str,
              };
              _this.customName = "";
            };
          }
        }
      }
    });
  },
  methods: {
    signInput(v) {
      this.$store.commit("setSign", v);
    },
    copy(val) {
      if (val == "" || !val) {
        return;
      }
      let oInput = document.createElement("input");
      oInput.value = val;
      document.body.appendChild(oInput);
      oInput.select();
      document.execCommand("Copy");
      this.$message({
        message: "复制成功",
        type: "success",
      });
      oInput.remove();
    },
    befUpload(file) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      let _this = this;
      reader.onload = function () {
        _this.pendingFile = {
          originalName: file.name,
          base64: reader.result.split(",")[1],
          preview: reader.result,
        };
        _this.customName = file.name;
      };
      return false;
    },
    confirmUpload() {
      if (!this.pendingFile) {
        this.$message.warning("请先选择图片");
        return;
      }
      var fileName = this.customName || this.pendingFile.originalName;
      this.postUploadApi(fileName, this.pendingFile.base64);
    },
    postUploadApi(name, base64) {
      let _this = this;
      let urlInfo = {};
      if (!this.upForm.iscant) {
        urlInfo = {
          name: this.userInfo.login,
          repos: this.upForm.repos,
          cont: this.upForm.content,
        };
      } else {
        urlInfo = {
          name: this.userInfo.login,
          repos: this.upForm.repos,
          cont: this.upForm.delimit,
        };
      }
      let file_last = name.replace(/.+\./, "");
      let fileName = "";
      if (this.nameType == "1") {
        fileName = name;
      } else {
        fileName = md5(Math.random() + name) + "." + file_last;
      }
      if (urlInfo.cont == "/") {
        urlInfo.fileName = fileName;
      } else {
        urlInfo.fileName = "/" + fileName;
      }
      _this.fullscreenLoading = true;
      let data = {
        message: "Upload pictures via wishmelz-imgurl",
        content: base64,
      };
      upload(urlInfo, data)
        .then((res) => {
          _this.resData[0] = res.content.download_url;
          if (_this.upForm.iscant) {
            _this.resData[1] = `https://cdn.jsdelivr.net/gh/${_this.userInfo.login}/${_this.upForm.repos}@${_this.upForm.branch}${_this.upForm.delimit}/${res.content.name}`;
            _this.resData[2] = `![${_this.sign}](https://cdn.jsdelivr.net/gh/${_this.userInfo.login}/${_this.upForm.repos}@${_this.upForm.branch}${_this.upForm.delimit}/${res.content.name})`;
          } else {
            _this.resData[1] = `https://cdn.jsdelivr.net/gh/${_this.userInfo.login}/${_this.upForm.repos}@${_this.upForm.branch}${_this.upForm.content}/${res.content.name}`;
            _this.resData[2] = `![${_this.sign}](https://cdn.jsdelivr.net/gh/${_this.userInfo.login}/${_this.upForm.repos}@${_this.upForm.branch}${_this.upForm.content}/${res.content.name})`;
          }
          _this.fullscreenLoading = false;
          _this.$message.success("上传成功");
          _this.pendingFile = null;
          _this.customName = "";
        })
        .catch((err) => {
          console.log(err);
          _this.fullscreenLoading = false;
        });
    },
  },
};
</script>

<style>
.el-upload,
.el-upload-dragger {
  width: 100%;
}
.tag-group .el-tag {
  margin-right: 10px;
}
.tag-group .el-input {
  margin-top: 5px;
}
.preview-box {
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  padding: 10px;
}
.preview-img {
  max-width: 100%;
  max-height: 300px;
}
.resimg img {
  max-width: 100%;
  max-height: 100%;
}
.copy {
  cursor: pointer;
}
.imgbox {
  text-align: center;
}
.imgbox .el-image img {
  max-width: 100%;
  height: auto;
}
@media (max-width: 768px) {
  .tag-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .tag-group .el-tag {
    margin-bottom: 5px;
  }
  .tag-group .el-input {
    width: 100% !important;
  }
}
</style>
