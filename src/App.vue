<template>
  <div id="app">
    <div class="content">
      <keep-alive :include="cachedViews">
      <router-view />
      </keep-alive>
    </div>
    <!-- <van-tabbar v-model="active" placeholder style="margin-top: 20px;">
      <van-tabbar-item icon="home-o">标签</van-tabbar-item>
      <van-tabbar-item icon="search">标签</van-tabbar-item>
      <van-tabbar-item icon="friends-o">标签</van-tabbar-item>
      <van-tabbar-item icon="setting-o">标签</van-tabbar-item>
    </van-tabbar> -->
  </div>
</template>
<script setup>
// import Vue from 'vue';
const cachedViews = ref(['payroll']);
// const { $wechat } = Vue.config;
// $wechat.getLocation({
//   type: 'wgs84',
//   success: (res) => {
//     const latitude = res.latitude // 纬度，浮点数，范围为90 ~ -90
//     const longitude = res.longitude // 经度，浮点数，范围为180 ~ -180。
//     const speed = res.speed // 速度，以米/每秒计
//     const accuracy = res.accuracy // 位置精度
//     console.log(latitude, longitude, speed, accuracy)
//   },
//   fail: (err) => {
//     console.log(err, "没有这个环境")
//   }
// })
// $wechat.checkJsApi({
//   jsApiList: ['chooseImage'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
//   success: function (res) {
//     console.log(res, "wx");
//   }
// });
</script>
<style scoped lang="less">
#app {
  display: flex;
  flex-direction: column;
  &>.content {
    flex: 1;
    overflow: auto;
    // padding-bottom:20px;
  }
}
</style>
<style lang="less">
.custom-toast {
  width: auto;
  max-width: 40%;
}
// 详情页的标题栏样式
.fold_title {
  font-weight: bold;
  margin-left: -8PX;
  &::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 19px;
    border-radius: 15px;
    vertical-align: -5px;
    transform: translateX(-3px);
    background: #1989fa;
  }
}
.FilesBox {
  font-size: 14px;
  color: #646566;
  padding: 10px 16px;
  &>.title {
    padding-bottom: 10px;
  }
}
.Underline {
  // text-decoration: underline;
  border-bottom: 1px solid var(--color-text);
  text-align: center;
}
</style>