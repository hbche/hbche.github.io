---
#layout: page
title: 排序与搜索
date: 2023-03-03 15:04:00
tags: [算法]
---

## 排序算法

### 冒泡排序

#### 定义

冒泡排序（Bubble Sort）是一种简单直观的排序算法。它重复地走访过要排序的数列，一次比较两个元素，如果他们的顺序错误就把他们交换过来。走访数列的工作是重复地进行直到没有再需要交换，也就是说该数列已经排序完成。

![冒泡排序](https://www.runoob.com/wp-content/uploads/2019/03/bubbleSort.gif)

#### 算法步骤

```js
function bubbleSort(array, compareFn = defaultCompare) {
  const { length } = array;
  // n个元素只需要进行n - 1轮比较
  for (let i = 0; i < length - 1; i++) {
    for (let j = 0; j < length - i - 1; j++) {
      if (compareFn(array[j], array[j + 1])) {
        let temp = array[j + 1];
        array[j + 1] = array[j];
        array[j] = temp;
      }
    }
  }
}
```

### 选择排序

### 插入排序

### 归并排序

### 快速排序

### 计数排序

### 基数排序

## 搜索算法

## 随机算法
