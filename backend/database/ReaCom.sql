-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th12 20, 2025 lúc 06:56 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `truyen_gg_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `created_at`) VALUES
(1, 'Hành động', 'hanh-dong', '2025-11-08 14:57:50'),
(2, 'Tình cảm', 'tinh-cam', '2025-11-08 14:57:50'),
(3, 'Hài hước', 'hai-huoc', '2025-11-08 14:57:50'),
(4, 'Kinh dị', 'kinh-di', '2025-11-08 14:57:50'),
(5, 'Phiêu lưu', 'phieu-luu', '2025-11-08 14:57:50'),
(6, 'Siêu nhiên', 'sieu-nhien', '2025-11-08 14:57:50'),
(7, 'Đời thường', 'doi-thuong', '2025-11-08 14:57:50'),
(8, 'Học đường', 'hoc-duong', '2025-11-08 14:57:50'),
(9, 'Fantasy', 'fantasy', '2025-11-08 14:57:50'),
(10, 'Romance', 'romance', '2025-11-08 14:57:50'),
(11, 'Comedy', 'comedy', '2025-11-08 14:57:50'),
(12, 'Drama', 'drama', '2025-11-08 14:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chapters`
--

CREATE TABLE `chapters` (
  `id` int(11) NOT NULL,
  `comic_id` int(11) NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `views` int(11) DEFAULT 0,
  `status` enum('open','closed','vip') DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chapters`
--

INSERT INTO `chapters` (`id`, `comic_id`, `chapter_number`, `title`, `content`, `images`, `views`, `status`, `created_at`, `updated_at`) VALUES
(12, 7, 488, 'QUỶ THA', NULL, '[\"/uploads/chapters/7/page001_1762619278686_0.jpg\",\"/uploads/chapters/7/page002_1762619278687_1.jpg\",\"/uploads/chapters/7/page003_1762619278687_2.jpg\"]', 2, 'open', '2025-11-08 16:27:58', '2025-12-01 17:05:58'),
(13, 7, 489, 'MỞ PHONG ẤN', NULL, '[\"/uploads/chapters/7/page001_1762619297745_0.jpg\",\"/uploads/chapters/7/page002_1762619297746_1.jpg\",\"/uploads/chapters/7/page003_1762619297746_2.jpg\"]', 1, 'open', '2025-11-08 16:28:17', '2025-12-07 14:53:40'),
(14, 8, 1, 'THẬT Ư', NULL, '[\"/uploads/chapters/8/page001_1762619644508_0.jpg\",\"/uploads/chapters/8/page002_1762619644508_1.jpg\",\"/uploads/chapters/8/page003_1762619644509_2.jpg\",\"/uploads/chapters/8/page004_1762619644509_3.jpg\",\"/uploads/chapters/8/page005_1762619644510_4.jpg\",\"/uploads/chapters/8/page006_1762619644510_5.jpg\",\"/uploads/chapters/8/page007_1762619644511_6.jpg\",\"/uploads/chapters/8/page008_1762619644511_7.jpg\",\"/uploads/chapters/8/page009_1762619644511_8.jpg\"]', 9, 'open', '2025-11-08 16:34:04', '2025-12-12 19:12:52'),
(15, 8, 2, 'ĐÔI MẮT ẤY', NULL, '[\"/uploads/chapters/8/page001_1762619662680_0.jpg\",\"/uploads/chapters/8/page002_1762619662681_1.jpg\",\"/uploads/chapters/8/page003_1762619662681_2.jpg\",\"/uploads/chapters/8/page004_1762619662682_3.jpg\",\"/uploads/chapters/8/page005_1762619662682_4.jpg\"]', 3, 'open', '2025-11-08 16:34:22', '2025-12-03 07:23:04'),
(16, 8, 3, 'ĐỊNH MỆNH VẪY GỌI', NULL, '[\"/uploads/chapters/8/page001_1762791086941_0.jpg\",\"/uploads/chapters/8/page002_1762791086942_1.jpg\",\"/uploads/chapters/8/page003_1762791086943_2.jpg\",\"/uploads/chapters/8/page004_1762791086944_3.jpg\"]', 3, 'open', '2025-11-10 16:11:26', '2025-12-01 19:31:02'),
(17, 9, 1, NULL, NULL, '[\"/uploads/chapters/9/page001_1764604726345_0.jpg\",\"/uploads/chapters/9/page002_1764604726346_1.jpg\",\"/uploads/chapters/9/page003_1764604726346_2.jpg\",\"/uploads/chapters/9/page004_1764604726347_3.jpg\"]', 0, 'open', '2025-12-01 15:58:46', '2025-12-01 15:58:46'),
(18, 9, 2, NULL, NULL, '[\"/uploads/chapters/9/page001_1764604737418_0.jpg\",\"/uploads/chapters/9/page002_1764604737418_1.jpg\",\"/uploads/chapters/9/page003_1764604737419_2.jpg\",\"/uploads/chapters/9/page004_1764604737419_3.jpg\"]', 1, 'open', '2025-12-01 15:58:57', '2025-12-01 16:20:32'),
(19, 9, 3, NULL, NULL, '[\"/uploads/chapters/9/page001_1764604751958_0.jpg\",\"/uploads/chapters/9/page002_1764604751959_1.jpg\",\"/uploads/chapters/9/page003_1764604751959_2.jpg\",\"/uploads/chapters/9/page004_1764604751959_3.jpg\",\"/uploads/chapters/9/page005_1764604751960_4.jpg\",\"/uploads/chapters/9/page006_1764604751960_5.jpg\",\"/uploads/chapters/9/page007_1764604751960_6.jpg\",\"/uploads/chapters/9/page008_1764604751960_7.jpg\"]', 0, 'open', '2025-12-01 15:59:11', '2025-12-01 20:35:45'),
(20, 10, 1, NULL, NULL, '[\"/uploads/chapters/10/page001_1764604849014_0.jpg\",\"/uploads/chapters/10/page002_1764604849014_1.jpg\",\"/uploads/chapters/10/page003_1764604849015_2.jpg\"]', 1, 'open', '2025-12-01 16:00:49', '2025-12-02 14:27:33'),
(21, 10, 2, NULL, NULL, '[\"/uploads/chapters/10/page001_1764604858866_0.jpg\",\"/uploads/chapters/10/page002_1764604858867_1.jpg\",\"/uploads/chapters/10/page003_1764604858867_2.jpg\",\"/uploads/chapters/10/page004_1764604858868_3.jpg\",\"/uploads/chapters/10/page005_1764604858868_4.jpg\",\"/uploads/chapters/10/page006_1764604858869_5.jpg\",\"/uploads/chapters/10/page007_1764604858869_6.jpg\",\"/uploads/chapters/10/page008_1764604858870_7.jpg\"]', 1, 'open', '2025-12-01 16:00:58', '2025-12-02 14:27:38'),
(22, 11, 1, NULL, NULL, '[\"/uploads/chapters/11/page001_1764605018399_0.jpg\",\"/uploads/chapters/11/page002_1764605018399_1.jpg\",\"/uploads/chapters/11/page003_1764605018399_2.jpg\",\"/uploads/chapters/11/page004_1764605018400_3.jpg\",\"/uploads/chapters/11/page005_1764605018401_4.jpg\",\"/uploads/chapters/11/page006_1764605018401_5.jpg\",\"/uploads/chapters/11/page007_1764605018401_6.jpg\",\"/uploads/chapters/11/page008_1764605018402_7.jpg\"]', 0, 'open', '2025-12-01 16:03:38', '2025-12-01 16:03:38'),
(23, 12, 1, NULL, NULL, '[\"/uploads/chapters/12/page001_1764605126718_0.jpg\",\"/uploads/chapters/12/page002_1764605126718_1.jpg\",\"/uploads/chapters/12/page003_1764605126718_2.jpg\",\"/uploads/chapters/12/page004_1764605126719_3.jpg\",\"/uploads/chapters/12/page005_1764605126719_4.jpg\",\"/uploads/chapters/12/page006_1764605126720_5.jpg\",\"/uploads/chapters/12/page007_1764605126720_6.jpg\"]', 0, 'open', '2025-12-01 16:05:26', '2025-12-01 16:05:26'),
(24, 12, 2, NULL, NULL, '[\"/uploads/chapters/12/page001_1764605139340_0.jpg\",\"/uploads/chapters/12/page002_1764605139340_1.jpg\",\"/uploads/chapters/12/page003_1764605139341_2.jpg\",\"/uploads/chapters/12/page004_1764605139341_3.jpg\",\"/uploads/chapters/12/page005_1764605139341_4.jpg\",\"/uploads/chapters/12/page006_1764605139342_5.jpg\",\"/uploads/chapters/12/page007_1764605139342_6.jpg\"]', 0, 'open', '2025-12-01 16:05:39', '2025-12-01 16:05:39'),
(25, 13, 1, NULL, NULL, '[\"/uploads/chapters/13/page001_1764605235446_0.jpg\",\"/uploads/chapters/13/page002_1764605235447_1.jpg\",\"/uploads/chapters/13/page003_1764605235447_2.jpg\",\"/uploads/chapters/13/page004_1764605235448_3.jpg\",\"/uploads/chapters/13/page005_1764605235448_4.jpg\",\"/uploads/chapters/13/page006_1764605235449_5.jpg\",\"/uploads/chapters/13/page007_1764605235449_6.jpg\",\"/uploads/chapters/13/page008_1764605235449_7.jpg\",\"/uploads/chapters/13/page009_1764605235450_8.jpg\",\"/uploads/chapters/13/page010_1764605235450_9.jpg\",\"/uploads/chapters/13/page011_1764605235450_10.jpg\"]', 0, 'open', '2025-12-01 16:07:15', '2025-12-01 16:07:15'),
(26, 13, 2, NULL, NULL, '[\"/uploads/chapters/13/page001_1764605279866_0.jpg\",\"/uploads/chapters/13/page002_1764605279867_1.jpg\",\"/uploads/chapters/13/page003_1764605279868_2.jpg\",\"/uploads/chapters/13/page004_1764605279868_3.jpg\",\"/uploads/chapters/13/page005_1764605279869_4.jpg\",\"/uploads/chapters/13/page006_1764605279870_5.jpg\"]', 0, 'open', '2025-12-01 16:07:59', '2025-12-01 16:07:59'),
(27, 14, 1, NULL, NULL, '[\"/uploads/chapters/14/page001_1764605508985_0.jpg\",\"/uploads/chapters/14/page002_1764605508985_1.jpg\",\"/uploads/chapters/14/page003_1764605508986_2.jpg\",\"/uploads/chapters/14/page004_1764605509004_3.jpg\"]', 11, 'open', '2025-12-01 16:11:49', '2025-12-03 07:20:22'),
(28, 14, 2, NULL, NULL, '[\"/uploads/chapters/14/page001_1764605532877_0.jpg\",\"/uploads/chapters/14/page002_1764605532878_1.jpg\",\"/uploads/chapters/14/page003_1764605532878_2.jpg\",\"/uploads/chapters/14/page004_1764605532878_3.jpg\",\"/uploads/chapters/14/page005_1764605532879_4.jpg\",\"/uploads/chapters/14/page006_1764605532892_5.jpg\"]', 7, 'open', '2025-12-01 16:12:12', '2025-12-01 20:35:42'),
(29, 15, 1, NULL, NULL, '[\"/uploads/chapters/15/page001_1764605618654_0.jpg\",\"/uploads/chapters/15/page002_1764605618654_1.jpg\",\"/uploads/chapters/15/page003_1764605618655_2.jpg\",\"/uploads/chapters/15/page004_1764605618656_3.jpg\",\"/uploads/chapters/15/page005_1764605618656_4.jpg\",\"/uploads/chapters/15/page006_1764605618656_5.jpg\",\"/uploads/chapters/15/page007_1764605618657_6.jpg\"]', 1, 'open', '2025-12-01 16:13:38', '2025-12-01 16:22:26'),
(30, 15, 2, NULL, NULL, '[\"/uploads/chapters/15/page001_1764605626431_0.jpg\",\"/uploads/chapters/15/page002_1764605626431_1.jpg\",\"/uploads/chapters/15/page003_1764605626432_2.jpg\",\"/uploads/chapters/15/page004_1764605626432_3.jpg\"]', 0, 'open', '2025-12-01 16:13:46', '2025-12-01 16:13:46'),
(31, 16, 1, NULL, NULL, '[\"/uploads/chapters/16/page001_1764605740615_0.jpg\",\"/uploads/chapters/16/page002_1764605740615_1.jpg\",\"/uploads/chapters/16/page003_1764605740616_2.jpg\",\"/uploads/chapters/16/page004_1764605740617_3.jpg\",\"/uploads/chapters/16/page005_1764605740617_4.jpg\",\"/uploads/chapters/16/page006_1764605740618_5.jpg\",\"/uploads/chapters/16/page007_1764605740618_6.jpg\"]', 0, 'open', '2025-12-01 16:15:40', '2025-12-01 16:15:40'),
(32, 16, 2, NULL, NULL, '[\"/uploads/chapters/16/page001_1764605750862_0.jpg\",\"/uploads/chapters/16/page002_1764605750862_1.jpg\",\"/uploads/chapters/16/page003_1764605750863_2.jpg\",\"/uploads/chapters/16/page004_1764605750863_3.jpg\",\"/uploads/chapters/16/page005_1764605750863_4.jpg\",\"/uploads/chapters/16/page006_1764605750864_5.jpg\",\"/uploads/chapters/16/page007_1764605750864_6.jpg\"]', 0, 'open', '2025-12-01 16:15:50', '2025-12-01 16:15:50'),
(33, 17, 1, NULL, NULL, '[\"/uploads/chapters/17/page001_1764605856861_0.jpg\",\"/uploads/chapters/17/page002_1764605856861_1.jpg\",\"/uploads/chapters/17/page003_1764605856861_2.jpg\",\"/uploads/chapters/17/page004_1764605856862_3.jpg\",\"/uploads/chapters/17/page005_1764605856862_4.jpg\",\"/uploads/chapters/17/page006_1764605856863_5.jpg\"]', 6, 'vip', '2025-12-01 16:17:36', '2025-12-11 08:54:27'),
(34, 17, 2, NULL, NULL, '[\"/uploads/chapters/17/page001_1764605867238_0.jpg\",\"/uploads/chapters/17/page002_1764605867239_1.jpg\",\"/uploads/chapters/17/page003_1764605867239_2.jpg\",\"/uploads/chapters/17/page004_1764605867240_3.jpg\",\"/uploads/chapters/17/page005_1764605867240_4.jpg\",\"/uploads/chapters/17/page006_1764605867241_5.jpg\",\"/uploads/chapters/17/page007_1764605867242_6.jpg\"]', 2, 'open', '2025-12-01 16:17:47', '2025-12-01 17:27:54'),
(35, 18, 1, NULL, NULL, '[\"/uploads/chapters/18/page001_1764605927645_0.jpg\",\"/uploads/chapters/18/page002_1764605927645_1.jpg\",\"/uploads/chapters/18/page003_1764605927646_2.jpg\",\"/uploads/chapters/18/page004_1764605927646_3.jpg\",\"/uploads/chapters/18/page005_1764605927647_4.jpg\",\"/uploads/chapters/18/page006_1764605927647_5.jpg\"]', 1, 'open', '2025-12-01 16:18:47', '2025-12-01 17:29:34'),
(36, 18, 2, NULL, NULL, '[\"/uploads/chapters/18/page001_1764605936197_0.jpg\",\"/uploads/chapters/18/page002_1764605936198_1.jpg\",\"/uploads/chapters/18/page003_1764605936198_2.jpg\",\"/uploads/chapters/18/page004_1764605936198_3.jpg\",\"/uploads/chapters/18/page005_1764605936199_4.jpg\",\"/uploads/chapters/18/page006_1764605936199_5.jpg\"]', 0, 'open', '2025-12-01 16:18:56', '2025-12-01 16:18:56'),
(37, 15, 3, NULL, NULL, '[\"/uploads/chapters/15/page001_1764608591334_0.jpg\",\"/uploads/chapters/15/page002_1764608591335_1.jpg\",\"/uploads/chapters/15/page003_1764608591335_2.jpg\",\"/uploads/chapters/15/page004_1764608591335_3.jpg\"]', 0, 'open', '2025-12-01 17:03:11', '2025-12-01 17:03:11'),
(38, 17, 3, NULL, NULL, '[\"/uploads/chapters/17/page001_1764610990197_0.jpg\",\"/uploads/chapters/17/page002_1764610990197_1.jpg\"]', 2, 'open', '2025-12-01 17:43:10', '2025-12-01 20:35:38'),
(39, 19, 1, NULL, NULL, '[\"/uploads/chapters/19/page001_1764662176584_0.jpg\",\"/uploads/chapters/19/page002_1764662176584_1.jpg\",\"/uploads/chapters/19/page003_1764662176585_2.jpg\"]', 0, 'open', '2025-12-02 07:56:16', '2025-12-02 07:56:16'),
(40, 19, 2, NULL, NULL, '[\"/uploads/chapters/19/page001_1764662186366_0.jpg\",\"/uploads/chapters/19/page002_1764662186367_1.jpg\",\"/uploads/chapters/19/page003_1764662186367_2.jpg\"]', 0, 'open', '2025-12-02 07:56:26', '2025-12-02 07:56:26'),
(41, 20, 1, NULL, NULL, '[\"/uploads/chapters/20/page001_1764662276697_0.jpg\",\"/uploads/chapters/20/page002_1764662276697_1.jpg\",\"/uploads/chapters/20/page003_1764662276697_2.jpg\"]', 0, 'open', '2025-12-02 07:57:56', '2025-12-02 07:57:56'),
(42, 21, 1, NULL, NULL, '[\"/uploads/chapters/21/page001_1764662362187_0.jpg\",\"/uploads/chapters/21/page002_1764662362187_1.jpg\",\"/uploads/chapters/21/page003_1764662362188_2.jpg\"]', 0, 'open', '2025-12-02 07:59:22', '2025-12-02 07:59:22'),
(43, 22, 1, NULL, NULL, '[\"/uploads/chapters/22/page001_1764662481575_0.jpg\",\"/uploads/chapters/22/page002_1764662481575_1.jpg\",\"/uploads/chapters/22/page003_1764662481575_2.jpg\"]', 0, 'open', '2025-12-02 08:01:21', '2025-12-02 08:01:21'),
(44, 23, 1, NULL, NULL, '[\"/uploads/chapters/23/page001_1764662650515_0.jpg\",\"/uploads/chapters/23/page002_1764662650516_1.jpg\",\"/uploads/chapters/23/page003_1764662650516_2.jpg\"]', 0, 'open', '2025-12-02 08:04:10', '2025-12-02 08:04:10'),
(45, 24, 1, NULL, NULL, '[\"/uploads/chapters/24/page001_1764662726272_0.jpg\",\"/uploads/chapters/24/page002_1764662726272_1.jpg\",\"/uploads/chapters/24/page003_1764662726272_2.jpg\"]', 0, 'open', '2025-12-02 08:05:26', '2025-12-02 08:05:26'),
(46, 26, 1, NULL, NULL, '[\"/uploads/chapters/26/page001_1764662890380_0.jpg\",\"/uploads/chapters/26/page002_1764662890380_1.jpg\",\"/uploads/chapters/26/page003_1764662890381_2.jpg\"]', 0, 'open', '2025-12-02 08:08:10', '2025-12-02 08:08:10'),
(47, 26, 2, NULL, NULL, '[\"/uploads/chapters/26/page001_1764662900305_0.jpg\",\"/uploads/chapters/26/page002_1764662900305_1.jpg\",\"/uploads/chapters/26/page003_1764662900306_2.jpg\"]', 0, 'open', '2025-12-02 08:08:20', '2025-12-02 08:08:20'),
(48, 27, 1, NULL, NULL, '[\"/uploads/chapters/27/page001_1764662966633_0.jpg\",\"/uploads/chapters/27/page002_1764662966633_1.jpg\",\"/uploads/chapters/27/page003_1764662966633_2.jpg\"]', 0, 'open', '2025-12-02 08:09:26', '2025-12-02 08:09:26'),
(49, 28, 1, NULL, NULL, '[\"/uploads/chapters/28/page001_1764663048790_0.jpg\",\"/uploads/chapters/28/page002_1764663048791_1.jpg\",\"/uploads/chapters/28/page003_1764663048792_2.jpg\"]', 0, 'open', '2025-12-02 08:10:48', '2025-12-02 08:10:48'),
(50, 28, 2, NULL, NULL, '[\"/uploads/chapters/28/page001_1764663055760_0.jpg\"]', 0, 'open', '2025-12-02 08:10:55', '2025-12-02 08:10:55'),
(51, 29, 1, NULL, NULL, '[\"/uploads/chapters/29/page001_1764663109464_0.jpg\",\"/uploads/chapters/29/page002_1764663109465_1.jpg\"]', 0, 'open', '2025-12-02 08:11:49', '2025-12-02 08:11:49'),
(52, 29, 2, NULL, NULL, '[\"/uploads/chapters/29/page001_1764663117731_0.jpg\",\"/uploads/chapters/29/page002_1764663117732_1.jpg\",\"/uploads/chapters/29/page003_1764663117732_2.jpg\"]', 0, 'open', '2025-12-02 08:11:57', '2025-12-02 08:11:57'),
(53, 30, 1, NULL, NULL, '[\"/uploads/chapters/30/page001_1764663185716_0.jpg\",\"/uploads/chapters/30/page002_1764663185716_1.jpg\",\"/uploads/chapters/30/page003_1764663185717_2.jpg\"]', 0, 'open', '2025-12-02 08:13:05', '2025-12-02 08:13:05'),
(54, 30, 2, NULL, NULL, '[\"/uploads/chapters/30/page001_1764663194774_0.jpg\",\"/uploads/chapters/30/page002_1764663194774_1.jpg\",\"/uploads/chapters/30/page003_1764663194774_2.jpg\"]', 0, 'open', '2025-12-02 08:13:14', '2025-12-02 08:13:14'),
(55, 31, 1, NULL, NULL, '[\"/uploads/chapters/31/page001_1764663275108_0.jpg\",\"/uploads/chapters/31/page002_1764663275108_1.jpg\"]', 0, 'open', '2025-12-02 08:14:35', '2025-12-02 08:14:35'),
(56, 32, 1, NULL, NULL, '[\"/uploads/chapters/32/page001_1764663342872_0.jpg\",\"/uploads/chapters/32/page002_1764663342872_1.jpg\",\"/uploads/chapters/32/page003_1764663342872_2.jpg\"]', 0, 'open', '2025-12-02 08:15:42', '2025-12-02 08:15:42'),
(57, 32, 2, NULL, NULL, '[\"/uploads/chapters/32/page001_1764663350366_0.jpg\",\"/uploads/chapters/32/page002_1764663350367_1.jpg\"]', 0, 'open', '2025-12-02 08:15:50', '2025-12-02 08:15:50'),
(58, 33, 1, NULL, NULL, '[\"/uploads/chapters/33/page001_1764663408353_0.jpg\",\"/uploads/chapters/33/page002_1764663408353_1.jpg\",\"/uploads/chapters/33/page003_1764663408354_2.jpg\"]', 0, 'open', '2025-12-02 08:16:48', '2025-12-02 08:16:48'),
(59, 33, 2, NULL, NULL, '[\"/uploads/chapters/33/page001_1764663415464_0.jpg\",\"/uploads/chapters/33/page002_1764663415464_1.jpg\",\"/uploads/chapters/33/page003_1764663415464_2.jpg\"]', 0, 'open', '2025-12-02 08:16:55', '2025-12-02 08:16:55'),
(60, 34, 1, NULL, NULL, '[\"/uploads/chapters/34/page001_1764663465178_0.jpg\",\"/uploads/chapters/34/page002_1764663465179_1.jpg\"]', 0, 'open', '2025-12-02 08:17:45', '2025-12-02 08:17:45'),
(61, 35, 1, NULL, NULL, '[\"/uploads/chapters/35/page001_1764663578429_0.jpg\",\"/uploads/chapters/35/page002_1764663578429_1.jpg\",\"/uploads/chapters/35/page003_1764663578429_2.jpg\",\"/uploads/chapters/35/page004_1764663578430_3.jpg\"]', 0, 'open', '2025-12-02 08:19:38', '2025-12-02 08:19:38'),
(62, 35, 2, NULL, NULL, '[\"/uploads/chapters/35/page001_1764663586466_0.jpg\",\"/uploads/chapters/35/page002_1764663586467_1.jpg\",\"/uploads/chapters/35/page003_1764663586467_2.jpg\"]', 0, 'open', '2025-12-02 08:19:46', '2025-12-02 08:19:46'),
(63, 36, 1, NULL, NULL, '[\"/uploads/chapters/36/page001_1764663649780_0.jpg\",\"/uploads/chapters/36/page002_1764663649780_1.jpg\",\"/uploads/chapters/36/page003_1764663649781_2.jpg\",\"/uploads/chapters/36/page004_1764663649782_3.jpg\"]', 0, 'open', '2025-12-02 08:20:49', '2025-12-02 08:20:49'),
(64, 36, 2, NULL, NULL, '[\"/uploads/chapters/36/page001_1764663656772_0.jpg\",\"/uploads/chapters/36/page002_1764663656772_1.jpg\",\"/uploads/chapters/36/page003_1764663656773_2.jpg\"]', 0, 'open', '2025-12-02 08:20:56', '2025-12-02 08:20:56'),
(65, 37, 1, NULL, NULL, '[\"/uploads/chapters/37/page001_1764663720492_0.jpg\",\"/uploads/chapters/37/page002_1764663720492_1.jpg\",\"/uploads/chapters/37/page003_1764663720493_2.jpg\"]', 0, 'open', '2025-12-02 08:22:00', '2025-12-02 08:22:00'),
(66, 37, 2, NULL, NULL, '[\"/uploads/chapters/37/page001_1764663727492_0.jpg\",\"/uploads/chapters/37/page002_1764663727492_1.jpg\",\"/uploads/chapters/37/page003_1764663727493_2.jpg\"]', 0, 'open', '2025-12-02 08:22:07', '2025-12-02 08:22:07'),
(67, 38, 1, NULL, NULL, '[\"/uploads/chapters/38/page001_1764663784071_0.jpg\",\"/uploads/chapters/38/page002_1764663784071_1.jpg\",\"/uploads/chapters/38/page003_1764663784071_2.jpg\"]', 0, 'open', '2025-12-02 08:23:04', '2025-12-02 08:23:04'),
(68, 38, 2, NULL, NULL, '[\"/uploads/chapters/38/page001_1764663790416_0.jpg\",\"/uploads/chapters/38/page002_1764663790417_1.jpg\",\"/uploads/chapters/38/page003_1764663790417_2.jpg\"]', 0, 'open', '2025-12-02 08:23:10', '2025-12-02 08:23:10'),
(69, 39, 1, NULL, NULL, '[\"/uploads/chapters/39/page001_1764663869097_0.jpg\",\"/uploads/chapters/39/page002_1764663869098_1.jpg\"]', 0, 'open', '2025-12-02 08:24:29', '2025-12-02 08:24:29'),
(70, 40, 1, NULL, NULL, '[\"/uploads/chapters/40/page001_1764663923776_0.jpg\",\"/uploads/chapters/40/page002_1764663923777_1.jpg\",\"/uploads/chapters/40/page003_1764663923777_2.jpg\"]', 0, 'open', '2025-12-02 08:25:23', '2025-12-02 08:25:23'),
(71, 40, 2, NULL, NULL, '[\"/uploads/chapters/40/page001_1764663931007_0.jpg\",\"/uploads/chapters/40/page002_1764663931007_1.jpg\"]', 0, 'open', '2025-12-02 08:25:31', '2025-12-02 08:25:31'),
(72, 41, 1, NULL, NULL, '[\"/uploads/chapters/41/page001_1764664051894_0.jpg\",\"/uploads/chapters/41/page002_1764664051894_1.jpg\",\"/uploads/chapters/41/page003_1764664051895_2.jpg\"]', 0, 'open', '2025-12-02 08:27:31', '2025-12-02 08:27:31'),
(73, 42, 1, NULL, NULL, '[\"/uploads/chapters/42/page001_1764664131832_0.jpg\",\"/uploads/chapters/42/page002_1764664131832_1.jpg\",\"/uploads/chapters/42/page003_1764664131832_2.jpg\"]', 0, 'open', '2025-12-02 08:28:51', '2025-12-02 08:28:51'),
(74, 42, 2, NULL, NULL, '[\"/uploads/chapters/42/page001_1764664138250_0.jpg\",\"/uploads/chapters/42/page002_1764664138250_1.jpg\",\"/uploads/chapters/42/page003_1764664138251_2.jpg\"]', 0, 'open', '2025-12-02 08:28:58', '2025-12-02 08:28:58'),
(75, 42, 3, NULL, NULL, '[\"/uploads/chapters/42/page001_1764664144888_0.jpg\",\"/uploads/chapters/42/page002_1764664144888_1.jpg\",\"/uploads/chapters/42/page003_1764664144889_2.jpg\"]', 0, 'open', '2025-12-02 08:29:04', '2025-12-02 08:29:04'),
(76, 43, 1, NULL, NULL, '[\"/uploads/chapters/43/page001_1764664203742_0.jpg\",\"/uploads/chapters/43/page002_1764664203743_1.jpg\",\"/uploads/chapters/43/page003_1764664203743_2.jpg\"]', 0, 'open', '2025-12-02 08:30:03', '2025-12-02 08:30:03'),
(77, 43, 2, NULL, NULL, '[\"/uploads/chapters/43/page001_1764664212436_0.jpg\",\"/uploads/chapters/43/page002_1764664212437_1.jpg\",\"/uploads/chapters/43/page003_1764664212437_2.jpg\"]', 0, 'open', '2025-12-02 08:30:12', '2025-12-02 08:30:12'),
(78, 44, 1, NULL, NULL, '[\"/uploads/chapters/44/page001_1764664261388_0.jpg\",\"/uploads/chapters/44/page002_1764664261389_1.jpg\",\"/uploads/chapters/44/page003_1764664261389_2.jpg\"]', 0, 'open', '2025-12-02 08:31:01', '2025-12-02 08:31:01'),
(79, 44, 2, NULL, NULL, '[\"/uploads/chapters/44/page001_1764664268501_0.jpg\",\"/uploads/chapters/44/page002_1764664268502_1.jpg\",\"/uploads/chapters/44/page003_1764664268502_2.jpg\"]', 0, 'open', '2025-12-02 08:31:08', '2025-12-02 08:31:08'),
(80, 45, 1, NULL, NULL, '[\"/uploads/chapters/45/page001_1764664346969_0.jpg\",\"/uploads/chapters/45/page002_1764664346969_1.jpg\",\"/uploads/chapters/45/page003_1764664346970_2.jpg\",\"/uploads/chapters/45/page004_1764664346970_3.jpg\"]', 0, 'open', '2025-12-02 08:32:26', '2025-12-02 08:32:26'),
(81, 46, 1, NULL, NULL, '[\"/uploads/chapters/46/page001_1764664393640_0.jpg\",\"/uploads/chapters/46/page002_1764664393640_1.jpg\",\"/uploads/chapters/46/page003_1764664393641_2.jpg\"]', 0, 'open', '2025-12-02 08:33:13', '2025-12-02 08:33:13'),
(82, 46, 2, NULL, NULL, '[\"/uploads/chapters/46/page001_1764664401274_0.jpg\",\"/uploads/chapters/46/page002_1764664401274_1.jpg\",\"/uploads/chapters/46/page003_1764664401274_2.jpg\"]', 0, 'open', '2025-12-02 08:33:21', '2025-12-02 08:33:21'),
(83, 47, 1, NULL, NULL, '[\"/uploads/chapters/47/page001_1764664577205_0.jpg\",\"/uploads/chapters/47/page002_1764664577205_1.jpg\"]', 0, 'open', '2025-12-02 08:36:17', '2025-12-02 08:36:17'),
(84, 47, 2, NULL, NULL, '[\"/uploads/chapters/47/page001_1764664584804_0.jpg\",\"/uploads/chapters/47/page002_1764664584804_1.jpg\",\"/uploads/chapters/47/page003_1764664584805_2.jpg\"]', 0, 'open', '2025-12-02 08:36:24', '2025-12-02 08:36:24'),
(85, 48, 1, NULL, NULL, '[\"/uploads/chapters/48/page001_1764664642825_0.jpg\",\"/uploads/chapters/48/page002_1764664642825_1.jpg\"]', 0, 'open', '2025-12-02 08:37:22', '2025-12-02 08:37:22'),
(86, 48, 2, NULL, NULL, '[\"/uploads/chapters/48/page001_1764664651039_0.jpg\",\"/uploads/chapters/48/page002_1764664651041_1.jpg\",\"/uploads/chapters/48/page003_1764664651041_2.jpg\"]', 0, 'open', '2025-12-02 08:37:31', '2025-12-02 08:37:31'),
(87, 49, 1, NULL, NULL, '[\"/uploads/chapters/49/page001_1764664755124_0.jpg\",\"/uploads/chapters/49/page002_1764664755124_1.jpg\",\"/uploads/chapters/49/page003_1764664755125_2.jpg\"]', 0, 'open', '2025-12-02 08:39:15', '2025-12-02 08:39:15'),
(88, 50, 1, NULL, NULL, '[\"/uploads/chapters/50/page001_1764664840141_0.jpg\",\"/uploads/chapters/50/page002_1764664840141_1.jpg\",\"/uploads/chapters/50/page003_1764664840142_2.jpg\"]', 0, 'open', '2025-12-02 08:40:40', '2025-12-02 08:40:40'),
(89, 50, 2, NULL, NULL, '[\"/uploads/chapters/50/page001_1764664848143_0.jpg\",\"/uploads/chapters/50/page002_1764664848144_1.jpg\",\"/uploads/chapters/50/page003_1764664848144_2.jpg\"]', 0, 'open', '2025-12-02 08:40:48', '2025-12-02 08:40:48'),
(90, 51, 1, NULL, NULL, '[\"/uploads/chapters/51/page001_1764664907470_0.jpg\",\"/uploads/chapters/51/page002_1764664907471_1.jpg\",\"/uploads/chapters/51/page003_1764664907471_2.jpg\"]', 0, 'open', '2025-12-02 08:41:47', '2025-12-02 08:41:47'),
(91, 51, 2, NULL, NULL, '[\"/uploads/chapters/51/page001_1764664916588_0.jpg\",\"/uploads/chapters/51/page002_1764664916588_1.jpg\",\"/uploads/chapters/51/page003_1764664916589_2.jpg\"]', 0, 'open', '2025-12-02 08:41:56', '2025-12-02 08:41:56'),
(92, 52, 1, NULL, NULL, '[\"/uploads/chapters/52/page001_1764664964998_0.jpg\",\"/uploads/chapters/52/page002_1764664964998_1.jpg\"]', 0, 'open', '2025-12-02 08:42:44', '2025-12-02 08:42:44'),
(93, 52, 2, NULL, NULL, '[\"/uploads/chapters/52/page001_1764664971764_0.jpg\",\"/uploads/chapters/52/page002_1764664971765_1.jpg\"]', 0, 'open', '2025-12-02 08:42:51', '2025-12-02 08:42:51'),
(94, 53, 1, NULL, NULL, '[\"/uploads/chapters/53/page001_1764665049565_0.jpg\",\"/uploads/chapters/53/page002_1764665049565_1.jpg\"]', 0, 'open', '2025-12-02 08:44:09', '2025-12-02 08:44:09'),
(95, 54, 1, NULL, NULL, '[\"/uploads/chapters/54/page001_1764665123899_0.jpg\",\"/uploads/chapters/54/page002_1764665123899_1.jpg\",\"/uploads/chapters/54/page003_1764665123900_2.jpg\",\"/uploads/chapters/54/page004_1764665123901_3.jpg\"]', 0, 'open', '2025-12-02 08:45:23', '2025-12-02 08:45:23'),
(96, 55, 1, NULL, NULL, '[\"/uploads/chapters/55/page001_1764665211863_0.jpg\",\"/uploads/chapters/55/page002_1764665211863_1.jpg\",\"/uploads/chapters/55/page003_1764665211863_2.jpg\"]', 0, 'open', '2025-12-02 08:46:51', '2025-12-02 08:46:51'),
(97, 55, 2, NULL, NULL, '[\"/uploads/chapters/55/page001_1764665218831_0.jpg\",\"/uploads/chapters/55/page002_1764665218831_1.jpg\",\"/uploads/chapters/55/page003_1764665218832_2.jpg\"]', 0, 'open', '2025-12-02 08:46:58', '2025-12-02 08:46:58'),
(99, 7, 1, NULL, NULL, '[\"/uploads/chapters/7/page001_1765119452270_0.png\"]', 1, 'open', '2025-12-07 14:57:32', '2025-12-07 14:57:55'),
(100, 14, 1000, NULL, NULL, '[\"/uploads/chapters/14/page001_1765443307904_0.png\"]', 1, 'open', '2025-12-11 08:55:07', '2025-12-11 08:55:25');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comics`
--

CREATE TABLE `comics` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `status` enum('ongoing','completed') DEFAULT 'ongoing',
  `access_status` enum('open','closed','vip') DEFAULT 'open',
  `country_id` int(11) DEFAULT NULL,
  `views` int(11) DEFAULT 0,
  `likes` int(11) DEFAULT 0,
  `follows` int(11) DEFAULT 0,
  `total_chapters` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `comics`
--

INSERT INTO `comics` (`id`, `title`, `slug`, `author`, `description`, `cover_image`, `status`, `access_status`, `country_id`, `views`, `likes`, `follows`, `total_chapters`, `created_at`, `updated_at`) VALUES
(7, 'Đấu Phá Thương Khung', 'au-pha-thuong-khung', 'Thiên Tằm Thổ Đậu, Mộng Tiên Giới', 'Đấu Phá Thương Khung kể về một thế giới thuộc về Đấu Khí, không hề có ma pháp hoa tiếu diễm lệ, chỉ có đấu khí cương mãnh phồn thịnh! Đấu Phá Thương Khung cũng là nơi mà các Luyện Dược Sư, những nhà luyện đan dược giúp tăng cấp tu luyện, phục hồi sức lực, hay thậm chí cửu tử hoàn sinh vô cùng được trọng vọng bởi tư chất hiếm có của họ. Tưởng tượng thế giới đó sẽ phát triển ra sao? Mời các bạn xem Đấu Phá Thương Khung! Hệ Thống Tu Luyện: Đấu Giả, Đấu Sư, Đại Đấu Sư, Đấu Linh, Đấu Vương, Đấu Hoàng, Đấu Tông, Đấu Tôn, Đấu Thánh, Đấu Đế. Hãy Bắt Đầu Từ Tiêu Viêm – một thiên tài tu luyện trong phút chốc trở thành phế vật, từ phế vật lại từng bước khẳng định lại chính mình! Trên bước đường từng bước khẳng định lại bản thân, trở thành một cao thủ siêu hạng, cũng như một Luyện Dược Sư đỉnh cao, Tiêu Viêm được một vị tôn sư bí mật có thân phận cùng năng lực cực cao không ngừng chỉ dạy. Hãy cùng bắt đầu cuộc hành trình đó với Đấu Phá Thương Khung. Đấu Phá Thương Khung là bộ truyện tranh được chuyển thể từ bộ tiểu thuyết tiên hiệp nổi tiếng cùng tên, tuy nhiên, một số chi tiết đã được thay đổi để bộ truyện có thêm nhiều nét hấp dẫn riêng.', '/uploads/comics/cover_image-1762619263078-502804351.jpg', 'ongoing', 'open', 3, 4, 2, 3, 3, '2025-11-08 16:27:43', '2025-12-07 14:57:55'),
(8, 'Định Mệnh Đôi Ta Giao Thoa Nơi Bến Tàu', 'inh-menh-oi-ta-giao-thoa-noi-ben-tau', '직씨', 'Truyện tranh Định Mệnh Đôi Ta Giao Thoa Nơi Bến Tàu được cập nhật nhanh và đầy đủ nhất tại TruyenGGVN. Bạn đọc đừng quên để lại bình luận và chia sẻ, ủng hộ TruyenGGVN ra các chương mới nhất của truyện Định Mệnh Đôi Ta Giao Thoa Nơi Bến Tàu .\r\n', '/uploads/comics/cover_image-1762619622968-774512667.jpg', 'ongoing', 'vip', 2, 15, 1, 1, 3, '2025-11-08 16:33:42', '2025-12-12 19:12:52'),
(9, 'She Doesn’t Know Why She Lives', 'she-doesn-t-know-why-she-lives', 'Đang Cập Nhật', 'Izumi Sumi, một nhân viên bán thời gian 25 tuổi phải chật vật với sự lo lắng và trầm cảm. Cô vẫn đang suy ngẫm về ý nghĩa cho cuộc sống của chính mình\r\n\r\n', '/uploads/comics/cover_image-1764604702448-806586630.jpg', 'ongoing', 'closed', 1, 1, 0, 0, 3, '2025-12-01 15:58:22', '2025-12-01 20:37:03'),
(10, 'Oniyome Wo Metotte Shimatta', 'oniyome-wo-metotte-shimatta', 'Awa Pako', 'Truyện về Momotarou đem lại hòa bình cho loài người bằng cách...\r\n\r\n', '/uploads/comics/cover_image-1764604833731-625789035.jpg', 'ongoing', 'open', 3, 2, 0, 0, 2, '2025-12-01 16:00:33', '2025-12-02 14:27:38'),
(11, 'JLA JSA: VIRTUE AND VICE', 'jla-jsa-virtue-and-vice', 'DC Comics', '', '/uploads/comics/cover_image-1764605001897-422350090.png', 'ongoing', 'open', NULL, 0, 0, 0, 1, '2025-12-01 16:03:21', '2025-12-01 16:03:38'),
(12, 'Cuốn Sách Ma Thuật Của Zero', 'cuon-sach-ma-thuat-cua-zero', 'Kakeru Kobashiri', 'Vào năm 526. Phù thủy và phép thuật của họ nổi tiếng khắp vùng đất, nhưng kiến thức về sự tồn tại của phép thuật rất khó nắm bắt và sử dụng. 1 đọa thú (thứ bị mọi người khinh miệt), là 1 lính đánh thuê, có ước mơ 1 ngày nào đó được trở thành người. Anh ấy gặp được 1 phù thủy tên là Zero có thể biến ước mơ mình thành hiện thực. Cô ấy đề nghị sẽ biến anh ta thành người nếu anh ta sẽ hộ tống cô ta như là người bảo vệ cô ta khi tìm kiếm một quyển sách ma thuật, một thứ nguy hiểm có thể hủy diệt cả thế giới nếu rơi vào tay kẻ xấu. Hai người bắt đầu cuộc du hành của họ với thỏa thuận này.', '/uploads/comics/cover_image-1764605114820-831811685.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-01 16:05:14', '2025-12-01 16:05:39'),
(13, 'Hoshi No Samidare ', 'hoshi-no-samidare', 'Mizukami Satoshi', 'Trái Đất đang đứng trước nguy cơ bị hủy diệt bởi thứ vũ khí \\\"Biscuit Hammer\\\" do pháp sư Animus tạo ra. Công chúa Anima đã triệu tập 12 Hiệp sĩ để ngăn chặn thảm họa đó Noi Crezant, một chú thằn lằn được gửi đến để thuyết phục Amamiya Yuuhi cùng nhau trở thành \\\"Hiệp sĩ Thằn lằn\\\". Tuy nhiên Yuuhi lại có phản ứng không như Noi mong đợi và hơn hết ngay cả đến \\\"công chúa\\\", người lãnh đạo các hiệp sĩ, lại có mục đích khác ngoài việc cứu Trái Đất.\r\n\r\n', '/uploads/comics/cover_image-1764605216252-886866079.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-01 16:06:56', '2025-12-01 16:07:59'),
(14, 'Missile & Plankton', 'missile-plankton', 'TSUTSUI Taishi', 'Đang cập nhật', '/uploads/comics/cover_image-1764605487278-261382022.png', 'ongoing', 'open', 3, 19, 1, 2, 3, '2025-12-01 16:11:27', '2025-12-11 08:55:25'),
(15, 'Task Force For Paranormal Disaster Management', 'task-force-for-paranormal-disaster-management', 'Đang Cập Nhật', 'Một bộ truyện tranh cổ điển về Kaijū của tác giả Otogi Matsuri & BTOOOM! Hãy theo chân các sĩ quan JSDF Yamato Yoshikazu và Sakimori Konoe khi họ đối mặt với những con quái vật không rõ nguồn gốc đang phá hoại vùng biển đang tranh chấp, khó khăn của biển Đông Á và coi con người là con mồi ưu tiên!\r\n\r\n', '/uploads/comics/cover_image-1764605605299-768711103.jpg', 'ongoing', 'open', 1, 1, 0, 0, 3, '2025-12-01 16:13:25', '2025-12-01 17:03:11'),
(16, 'Risou No Musume Nara Sekai Saikyou Demo Kawaigatte Kuremasuka', 'risou-no-musume-nara-sekai-saikyou-demo-kawaigatte-kuremasuka', 'Ghost Mikawa', 'Risou No Musume Nara Sekai Saikyou Demo Kawaigatte Kuremasuka:\r\nĐây là câu chuyện về một người cha bất bại và cô con gái mạnh nhất loài người...', '/uploads/comics/cover_image-1764605728019-21353336.jpg', 'ongoing', 'open', 3, 0, 0, 0, 2, '2025-12-01 16:15:28', '2025-12-01 16:15:50'),
(17, 'Điều Sai Trái', 'ieu-sai-trai', 'Asami Iruka', 'Kagami Yuko thức dậy trên giường nhà của một người đàn ông xa lạ. Cô đã phạm sai lầm khi uống rượu và khi không thể di chuyển được, cô đã gặp Azuma. Quãng thời gian của cô và Azuma thật êm dịu làm sao, hai người họ bắt đầu dành tình cảm cho nhau., nhưng họ đã thực sự gặp nhau ở trường trung học!! Cô là học sinh còn anh là giáo viên. Mặc dù họ biết rằng họ không nên cuốn hút đối phương, thế nhưng họ vẫn bắt đầu một câu chuyện tình yêu đầy lầm lỗi…\r\n\r\n', '/uploads/comics/cover_image-1764605848938-159457322.jpg', 'ongoing', 'open', 1, 10, 1, 1, 3, '2025-12-01 16:17:28', '2025-12-11 08:52:02'),
(18, 'Pashiri na Boku to Koisuru Banchou', 'pashiri-na-boku-to-koisuru-banchou', 'Đang Cập Nhật', 'Unoki-kun, một cậu bé bị bắt nạt từ khi còn học tiểu học, cuối cùng trở thành chân sai vặt độc quyền của nhỏ đầu gấu nhất trường, Toramaru-san, người đã nói với cậu ấy là \"Hãy trở thành của tôi\" ngay sau khi vào trung học. Nhưng sự thật thì đó là lời tỏ tình của Toramaru-san!! Đây là sự khởi đầu của câu chuyện tình yêu ẩn chứa biết bao hiểu lầm giữa Toramaru-san, người nghĩ rằng cô ấy đang hẹn hò với Uneki, người nghĩ cậu ta đang bị bắt nạt.\r\n\r\n', '/uploads/comics/cover_image-1764605919446-467941284.jpg', 'ongoing', 'open', 1, 1, 0, 0, 2, '2025-12-01 16:18:39', '2025-12-01 20:35:26'),
(19, 'Yukuyuku Futari', 'yukuyuku-futari', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764662163435-992325020.jpg', 'ongoing', 'open', 2, 0, 0, 0, 2, '2025-12-02 07:56:03', '2025-12-02 07:56:26'),
(20, 'Chuyển Sinh Cùng Bà Chị Đấm Phát Chết Luôn', 'chuyen-sinh-cung-ba-chi-am-phat-chet-luon', 'Đang Cập Nhật', 'Bà chị bro-con với khả năng xử gọn trong một hit và cậu em với chỉ số thấp lẹt đẹt cùng được triệu hồi sang dị giới.\r\n\r\n', '/uploads/comics/cover_image-1764662264490-802790363.jpg', 'ongoing', 'open', NULL, 0, 0, 0, 1, '2025-12-02 07:57:44', '2025-12-02 07:57:56'),
(21, 'Yuusha No Mago To Maou No Musume', 'yuusha-no-mago-to-maou-no-musume', 'Đang Cập Nhật', 'Sau cuộc đại chiến giữa Quỷ vương và anh hùng, phần thắng đương nhiên thuộc về chính nghĩa, ma tộc đã bị đẩy lùi, quỷ vương bị giết, vài năm sau - Con gái quỷ vương hành trình tìm đến vùng đất mới và cô ta gặp... Cháu gái của anh hùng, vì lẽ nào mà cả 2 cùng nhau đồng hành? đón xem bộ: Con gái quỷ vương và cháu gái anh hùng nhé!', '/uploads/comics/cover_image-1764662345338-73683769.jpg', 'ongoing', 'open', 2, 0, 0, 0, 1, '2025-12-02 07:59:05', '2025-12-02 07:59:22'),
(22, 'Dạo Quanh Ma Quốc', 'dao-quanh-ma-quoc', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764662471334-134213875.png', 'ongoing', 'open', 2, 0, 0, 0, 1, '2025-12-02 08:01:11', '2025-12-02 08:01:21'),
(23, 'Fushigi No Mayuri-San', 'fushigi-no-mayuri-san', 'Đang Cập Nhật', 'Yuusuke, cậu học sinh lớp 7 quan tâm đến chị của bạn mình.\r\nNgười chị ấy đôi lúc có chút kỳ lạ nhưng lại rất tốt và ân cần.\r\nBí ẩn nhưng nổi bật với mọi người.\r\nMột câu chuyện hài hước đời thường về cuộc sống hằng ngày của Mayuri.', '/uploads/comics/cover_image-1764662641096-50586773.jpg', 'ongoing', 'open', 1, 0, 0, 0, 1, '2025-12-02 08:04:01', '2025-12-02 08:04:10'),
(24, 'Ao no Miburo', 'ao-no-miburo', 'Đang Cập Nhật', 'Truyện được lấy bối cảnh của Kyoto năm 1863. Nhân vật chính là một chàng trai chính trực, tốt bụng và giàu tình cảm với trái tim luôn đầy ắp niềm tin về công lý. Thanh xuân đầy sóng gió của cậu bắt đầu từ khi cậu bắt gặp Toshizo Hijikata và Okita Souji, những samurai không còn chủ tướng trong thời kì Phong kiến Nhật Bản (Ronin).', '/uploads/comics/cover_image-1764662718287-438094742.jpg', 'ongoing', 'open', 1, 0, 0, 0, 1, '2025-12-02 08:05:18', '2025-12-02 08:05:26'),
(25, 'Đêm Của Bóng Tối', 'em-cua-bong-toi', 'Đang Cập Nhật', 'Areum Lee, người có giấc mơ tiên tri, một ngày nọ cô nhớ lại những cơn ác mộng tiên tri đã bị mình vô tình lãng quên\r\nVà trong cuốn sổ, có những điều về những giấc mơ mà tôi không thể nhớ nổi …\r\n‘Tôi chưa bao giờ viết bất cứ điều gì như thế này! Nhưng chắc chắn đây là giấc mơ của tôi …? ‘\r\nNhững con quái vật tôi nhìn thấy trong giấc mơ của mình lần lượt xuất hiện trong thực tế, và những người có khả năng đặc biệt bắt đầu xuất hiện trên thế giới.', '/uploads/comics/cover_image-1764662794835-679296279.jpg', 'ongoing', 'open', 2, 0, 0, 0, 0, '2025-12-02 08:06:34', '2025-12-02 08:06:34'),
(26, 'Mourning Bride', 'mourning-bride', 'moriyama daisuke', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764662881960-588577533.jpg', 'ongoing', 'open', NULL, 0, 0, 0, 2, '2025-12-02 08:08:01', '2025-12-02 08:08:20'),
(27, 'Kirai Ni Narimasu, Sayama-Kun!', 'kirai-ni-narimasu-sayama-kun', 'Nanato Samako', 'Câu chuyện về 2 người đứng đầu hội học sinh một trường cấp 3 và điều khoản éo le của hội phó để 2 người có thể thành người iu', '/uploads/comics/cover_image-1764662959184-224243099.jpg', 'ongoing', 'open', 1, 0, 0, 0, 1, '2025-12-02 08:09:19', '2025-12-02 08:09:26'),
(28, 'Cô Bạn Dễ Thương Cùng Bàn', 'co-ban-de-thuong-cung-ban', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764663040015-507533553.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:10:40', '2025-12-02 08:10:55'),
(29, 'Mizukoshi-Kun Wa Futtō Shitakunainoni', 'mizukoshi-kun-wa-futto-shitakunainoni', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764663101900-769845585.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:11:41', '2025-12-02 08:11:57'),
(30, 'Uchi Ni Neko Ga Yattekita!', 'uchi-ni-neko-ga-yattekita', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764663178401-552528862.jpg', 'ongoing', 'open', NULL, 0, 0, 0, 2, '2025-12-02 08:12:58', '2025-12-02 08:13:14'),
(31, 'Cự Kê Chiến Ký', 'cu-ke-chien-ky', 'Đang Cập Nhật', 'Một tia hi vọng loé sáng vào thời khắc trái đất lâm vào hiểm nguy. Tia hi vọng ấy chính là... một chú gà!', '/uploads/comics/cover_image-1764663257253-140068568.jpg', 'ongoing', 'open', 5, 0, 0, 0, 1, '2025-12-02 08:14:17', '2025-12-02 08:14:35'),
(32, 'Geesen Shoujo to Ibunka Kouryuu', 'geesen-shoujo-to-ibunka-kouryuu', '  Yasuhara Hirokazu', 'Một ANH nhân viên tại một cửa hàng trò chơi điện tử Nhật Bản gặp một cô gái trẻ đến từ nước Anh, và câu chuyện bắt đầu', '/uploads/comics/cover_image-1764663335242-813860930.jpg', 'ongoing', 'open', 2, 0, 0, 0, 2, '2025-12-02 08:15:35', '2025-12-02 08:15:50'),
(33, 'Tình duyên nơi cuộc chiến kiêu hùng', 'tinh-duyen-noi-cuoc-chien-kieu-hung', 'Đang Cập Nhật', 'Có một cặp song sinh khao khát sức mạnh áp đảo và thề sẽ trở thành \"anh hùng\". Tuy nhiên, ước mơ của Hiro đã tan thành bong bóng sau vài năm và trở thành nhân viên chịu trách nhiệm dọn dẹp tàn dư anh hùng để lại.Với sự tự ti nặng nề,Hiro đã chịu đựng và nhu nhuợc sống trong lốt vỏ bọc quần chúng,trái ngược với người anh em sinh đôi của mình. Và rồi đến một ngày,biến cố lớn đã xảy ra,trong lúc bảo vệ người bạn thời thơ ấu, Lũ anh hùng đã giết chết cậu....(hikkiteam)', '/uploads/comics/cover_image-1764663400694-933938760.jpg', 'ongoing', 'open', 3, 0, 0, 0, 2, '2025-12-02 08:16:40', '2025-12-02 08:16:55'),
(34, 'Moon Blade', 'moon-blade', 'Đang Cập Nhật', 'Chuyện kể về một thằng trẩu tộc Mink đang về nhà thì bị ăn nguyển quả Bom vào mồm và được triệu hồi sang thế giới khác ( chắc vậy ) <--- câu này sub 98% như tiếng Nhật!\r\n\r\n', '/uploads/comics/cover_image-1764663457494-787786914.jpg', 'ongoing', 'open', 1, 0, 0, 0, 1, '2025-12-02 08:17:37', '2025-12-02 08:17:45'),
(35, 'Ngày ấy ta bên nhau', 'ngay-ay-ta-ben-nhau', 'Yuki Obata', 'Câu chuyện xoay quanh Nanami Takahashi, hay còn gọi là Nana, khi cô bước vào năm đầu cấp 3 và gặp phải những biến cố đầy bất ngờ trong cuộc sống học đường. Từ việc bị lừa đảo đến tình yêu rực rỡ với Yano Motoharu – chàng hotboy của trường, bộ truyện dần khám phá tâm hồn và quá khứ phức tạp của họ.\r\n\r\nVới một kết cấu hấp dẫn, “Tình Yêu Học Trò” mang đến những cảm xúc sâu sắc và tình yêu đích thực giữa các nhân vật. Để hiểu rõ hơn về cuộc hành trình tình yêu đầy gian nan này, hãy cùng thưởng thức câu chuyện tuyệt vời này từ tác giả Yuki Obata.', '/uploads/comics/cover_image-1764663567630-887973683.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:19:27', '2025-12-02 08:19:46'),
(36, 'Kagekuri Kitan', 'kagekuri-kitan', 'Urakami Yuu', 'Hajime luôn trong nỗi sợ hãi với những cái bóng đen ma đáng sợ mà chỉ mình cậu mới thấy. Nhưng nhờ đó cậu đã gặp một cô gái bí ẩn, và cô gái đó cam kết giúp cậu đối mặt và vượt qua nỗi sợ hãi của chính mình, đổi lại từ đó cậu ấy đã bị kéo vào thế giới Ninja đầy nguy hiểm.\r\n\r\n', '/uploads/comics/cover_image-1764663633255-941073009.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:20:33', '2025-12-02 08:20:56'),
(37, 'Fumou Renai', 'fumou-renai', 'Barren Love', 'Một câu chuyện tình yêu trong sáng điên rồ giữa Zakuro và Mikoto.', '/uploads/comics/cover_image-1764663712285-996122214.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:21:52', '2025-12-02 08:22:07'),
(38, 'Tôi Không Thuộc Về Nơi Này', 'toi-khong-thuoc-ve-noi-nay', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764663776393-335742360.jpg', 'ongoing', 'open', 3, 0, 0, 0, 2, '2025-12-02 08:22:56', '2025-12-02 08:23:10'),
(39, 'Toàn Cầu Dị Năng Bắt Đầu Thức Tỉnh Tử Tiêu Thần', 'toan-cau-di-nang-bat-au-thuc-tinh-tu-tieu-than', 'Đang Cập Nhật', 'Toàn Cầu Dị Năng: Bắt Đầu Thức Tỉnh Tử Tiêu Thần Lôi:\r\nThế giới Lam tinh, hung thú hoành hành, người người đều có thể thức tỉnh dị năng, có cơ hội trở thành cường giả, uy trấn một phương! Nhưng mà, Hứa Cảnh Minh xuyên không tới vẻn vẹn chỉ có dị năng cấp E. May mà hệ thống xuất hiện, dị năng điện cấp E tăng lên thành Tử Tiêu Thần Lôi cấp S! Đánh giết hung thú là có thể thu hoạch được điểm dị năng! Điểm dị năng -1500000, Tử Tiêu Thần Lôi tiến hóa!Trở thành Hỗn Độn Thần Lôi cấp SSS! Thế là, tại lam tinh lưu lại truyền thuyết thuộc về Hứa Cảnh Minh.', '/uploads/comics/cover_image-1764663862098-520850351.jpg', 'ongoing', 'open', 3, 0, 0, 0, 1, '2025-12-02 08:24:22', '2025-12-02 08:24:29'),
(40, 'Thiên Tài Bình Dị', 'thien-tai-binh-di', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764663915760-695746655.jpg', 'ongoing', 'open', 3, 0, 0, 0, 2, '2025-12-02 08:25:15', '2025-12-02 08:25:31'),
(41, 'Ryuu To Hidari Te', 'ryuu-to-hidari-te', 'Đang Cập Nhật', 'Một nữ sinh trở lại làng của ông mình sau một thời gian dài kể tù khi gặp một  chàng trai bị nguyền rủa.', '/uploads/comics/cover_image-1764664042117-829949315.jpg', 'completed', 'open', 1, 0, 0, 0, 1, '2025-12-02 08:27:22', '2025-12-02 08:27:31'),
(42, 'World Gaze Clips', 'world-gaze-clips', 'Đang Cập Nhật', 'Tuyển tập truyện ngắn về \"thế giới quan\" của học sinh cấp 3', '/uploads/comics/cover_image-1764664120950-186388172.jpg', 'ongoing', 'open', 1, 0, 0, 0, 3, '2025-12-02 08:28:40', '2025-12-02 08:29:04'),
(43, 'Carnelian Blood', 'carnelian-blood', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764664191816-871749481.jpg', 'ongoing', 'open', 5, 0, 0, 0, 2, '2025-12-02 08:29:51', '2025-12-02 08:30:12'),
(44, 'Sol City', 'sol-city', 'Đang Cập Nhật', 'Ở một thế giới nơi mặt trời đột nhiên biến mất. Nhân loại bị kẹt trong bóng tối vĩnh hằng cùng bọn quái vật khát máu. Theo chân Bunta và Garey, 2 cậu bé sống ở bãi rác của thành phố trên con đường tìm lại gia đình của chúng và mặt trời của toàn nhân loại', '/uploads/comics/cover_image-1764664253889-840158627.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:30:53', '2025-12-02 08:31:08'),
(45, 'Anastasia', 'anastasia', 'Đang Cập Nhật', 'Trên bảng săn tin nhắn của trung tâm điều tra ngầm Codename Anastasia, một tin nhắn khẩn cấp từ một đối tác bí mật đã gửi tới. Anastasia, nữ đặc vụ hàng đầu của trung tâm, nhận nhiệm vụ bí mật để bảo vệ một bí mật quốc gia. Trong khi hành động bắt đầu, Anastasia nhận ra rằng mục tiêu mà cô phải bảo vệ không phải là một bức thông điệp hay một vật phẩm, mà chính là người đàn ông bí ẩn mà cô đã từng yêu thương trong quá khứ - người đã biến mất không dấu vết. Sự lựa chọn giữa tình cảm cá nhân và trách nhiệm nghề nghiệp đang đặt ra trước mắt Anastasia. Trên con đường nguy hiểm đầy hiểm nguy, cô phải đối mặt với những kẻ săn đuổi, vượt qua những thử thách khó khăn và khám phá những bí ẩn gợi cảm mà người đàn ông kia giấu kín. Liệu Anastasia có thể tìm ra sự thật đằng sau mọi âm mưu, giữ vững lòng kiên định và vượt qua mọi chướng ngại để hoàn thành nhiệm vụ của mình?', '/uploads/comics/cover_image-1764664340179-977176592.webp', 'ongoing', 'open', 3, 0, 0, 0, 1, '2025-12-02 08:32:20', '2025-12-02 08:32:26'),
(46, 'Những kẻ bên trong Genome', 'nhung-ke-ben-trong-genome', 'Đang Cập Nhật', 'Các game streamer từ các genre game khác nhau bị bắt cóc bởi một kẻ bí ẩn để quẩy game câu view......', '/uploads/comics/cover_image-1764664385335-918352453.jpg', 'ongoing', 'open', 3, 0, 0, 0, 2, '2025-12-02 08:33:05', '2025-12-02 08:33:21'),
(47, 'The Lost City', 'the-lost-city', 'Đang Cập Nhật', 'Chu Nam là người có khả năng cảm nhận ký ức của đồ vật ! Vì thế anh \"vô tình\" rơi vào những vụ án quỷ dị đầy bí ẩn, ma quái, rùng rợn đến lạnh người, chiến đấu và những màn đối đấu kịch tính... Những bí ẩn phía sau đang chờ bạn khám phá!', '/uploads/comics/cover_image-1764664565421-836305904.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:36:05', '2025-12-02 08:36:24'),
(48, 'Roid', 'roid', 'Shiroshi', 'Futagami Yui đã mất đi đôi chân trong một vụ tai nạn. Sau này cô là thành viên của câu lạc chế tạo robot. Và rồi cùng với đàn em là Kazumiya Reina, cả hai đã cùng nhau chế tạo ra người máy. Nhưng khi mọi thứ gần như hoàn thành, thì Reina đã bị bắt cóc. Chuyện gì đã xảy ra?', '/uploads/comics/cover_image-1764664634879-998245190.jpg', 'completed', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:37:14', '2025-12-02 08:37:54'),
(49, 'Hanebado!', 'hanebado', 'Kousuke Hamada', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764664748272-912521656.jpg', 'ongoing', 'open', 1, 0, 0, 0, 1, '2025-12-02 08:39:08', '2025-12-02 08:39:15'),
(50, 'Captain Tsubasa World Youth - Hậu Tsubasa', 'captain-tsubasa-world-youth-hau-tsubasa', 'Takahashi Yoichi', 'Phần tiếp theo của Tsubasa.\r\nKể về chuyến hành trình tìm đến ngôi vô địch thanh niên thế giới mà đội nhật đạt được.', '/uploads/comics/cover_image-1764664833007-141961911.webp', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:40:33', '2025-12-02 08:40:48'),
(51, 'Shoujo Kishidan x Knight Tale', 'shoujo-kishidan-x-knight-tale', 'Inue Shinsuke', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764664900014-792673733.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:41:40', '2025-12-02 08:41:56'),
(52, 'Kanojo ga Iru no ni Betsu no Onnanoko ni Kokuhaku Sareta', 'kanojo-ga-iru-no-ni-betsu-no-onnanoko-ni-kokuhaku-sareta', 'Hiroyuki', 'Một onshot 4 trang của Hiroyuki', '/uploads/comics/cover_image-1764664957738-968605956.jpg', 'ongoing', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:42:37', '2025-12-02 08:42:51'),
(53, 'Dracorun', 'dracorun', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764665042466-898857261.jpg', 'ongoing', 'open', 2, 0, 0, 0, 1, '2025-12-02 08:44:02', '2025-12-02 08:44:09'),
(54, 'Tondemo Skill De Isekai Hourou Meshi Sui No Dai Bouken', 'tondemo-skill-de-isekai-hourou-meshi-sui-no-dai-bouken', 'Đang Cập Nhật', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764665116968-181140176.jpg', 'ongoing', 'open', 3, 0, 0, 0, 1, '2025-12-02 08:45:16', '2025-12-02 08:45:23'),
(55, 'By chance, we...and', 'by-chance-we-and', 'Evngarion', 'Đang Cập Nhật', '/uploads/comics/cover_image-1764665204553-636422782.png', 'completed', 'open', 1, 0, 0, 0, 2, '2025-12-02 08:46:44', '2025-12-02 08:46:58');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comic_categories`
--

CREATE TABLE `comic_categories` (
  `comic_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `comic_categories`
--

INSERT INTO `comic_categories` (`comic_id`, `category_id`) VALUES
(7, 1),
(7, 3),
(7, 5),
(7, 9),
(7, 12),
(8, 2),
(8, 3),
(8, 10),
(9, 2),
(9, 3),
(9, 9),
(9, 12),
(10, 1),
(10, 2),
(10, 5),
(10, 6),
(10, 10),
(10, 12),
(11, 1),
(11, 5),
(11, 6),
(12, 2),
(12, 5),
(12, 6),
(12, 7),
(12, 12),
(13, 3),
(13, 5),
(14, 8),
(14, 10),
(14, 12),
(15, 2),
(15, 5),
(15, 6),
(15, 7),
(15, 8),
(16, 1),
(16, 2),
(16, 4),
(16, 6),
(16, 7),
(17, 2),
(17, 3),
(17, 5),
(17, 10),
(18, 2),
(18, 3),
(18, 5),
(18, 12),
(19, 2),
(19, 3),
(19, 4),
(19, 10),
(19, 12),
(20, 1),
(20, 3),
(20, 7),
(20, 8),
(21, 1),
(21, 5),
(21, 10),
(21, 12),
(22, 1),
(22, 3),
(22, 4),
(22, 5),
(22, 7),
(22, 8),
(23, 1),
(23, 3),
(23, 5),
(23, 12),
(24, 1),
(24, 4),
(24, 9),
(24, 11),
(25, 3),
(25, 6),
(25, 8),
(25, 12),
(26, 4),
(26, 5),
(26, 9),
(26, 12),
(27, 2),
(27, 5),
(27, 7),
(27, 8),
(27, 10),
(28, 1),
(28, 5),
(28, 8),
(28, 12),
(29, 3),
(29, 5),
(29, 8),
(29, 12),
(30, 5),
(30, 8),
(30, 9),
(30, 11),
(31, 5),
(31, 8),
(31, 12),
(32, 3),
(32, 5),
(32, 6),
(32, 12),
(33, 1),
(33, 4),
(33, 5),
(33, 9),
(33, 12),
(34, 3),
(34, 5),
(34, 8),
(34, 12),
(35, 3),
(35, 8),
(35, 12),
(36, 1),
(36, 5),
(36, 10),
(36, 12),
(37, 1),
(37, 4),
(37, 9),
(37, 11),
(38, 1),
(38, 4),
(38, 5),
(38, 9),
(39, 1),
(39, 2),
(39, 4),
(39, 6),
(40, 8),
(40, 9),
(40, 10),
(40, 12),
(41, 1),
(41, 2),
(41, 5),
(41, 7),
(42, 1),
(42, 4),
(42, 8),
(42, 12),
(43, 1),
(43, 3),
(43, 11),
(43, 12),
(44, 1),
(44, 4),
(44, 5),
(44, 7),
(44, 11),
(45, 3),
(45, 7),
(45, 8),
(45, 12),
(46, 3),
(46, 5),
(46, 8),
(46, 11),
(47, 3),
(47, 7),
(47, 8),
(47, 11),
(48, 3),
(48, 5),
(48, 7),
(48, 8),
(49, 3),
(49, 5),
(49, 7),
(49, 8),
(50, 3),
(50, 4),
(50, 8),
(50, 12),
(51, 1),
(51, 8),
(51, 9),
(51, 12),
(52, 1),
(52, 7),
(52, 8),
(53, 1),
(53, 4),
(53, 5),
(53, 7),
(54, 1),
(54, 4),
(54, 7),
(55, 2),
(55, 5),
(55, 7);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comic_id` int(11) DEFAULT NULL,
  `chapter_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL COMMENT 'ID của comment cha (nếu là reply)',
  `content` text NOT NULL,
  `likes_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comment_likes`
--

CREATE TABLE `comment_likes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `countries`
--

INSERT INTO `countries` (`id`, `name`, `slug`, `created_at`) VALUES
(1, 'Nhật Bản', 'nhat-ban', '2025-11-08 14:57:50'),
(2, 'Hàn Quốc', 'han-quoc', '2025-11-08 14:57:50'),
(3, 'Trung Quốc', 'trung-quoc', '2025-11-08 14:57:50'),
(4, 'Việt Nam', 'viet-nam', '2025-11-08 14:57:50'),
(5, 'Mỹ', 'my', '2025-11-08 14:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comic_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `comic_id`, `created_at`) VALUES
(9, 8, 7, '2025-12-07 14:50:21'),
(10, 9, 7, '2025-12-07 14:52:57');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `likes`
--

CREATE TABLE `likes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comic_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comic_id` int(11) DEFAULT NULL,
  `type` enum('new_chapter','comic_completed','new_comment','comment_liked') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `chapter_id` int(11) DEFAULT NULL,
  `chapter_number` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `comic_id`, `type`, `title`, `message`, `chapter_id`, `chapter_number`, `is_read`, `created_at`) VALUES
(11, 8, 7, 'new_chapter', 'Chương mới: Đấu Phá Thương Khung', 'Đấu Phá Thương Khung mà bạn đang theo dõi vừa đăng chương 1', NULL, 1, 1, '2025-12-07 14:54:23'),
(12, 9, 7, 'new_chapter', 'Chương mới: Đấu Phá Thương Khung', 'Đấu Phá Thương Khung mà bạn đang theo dõi vừa đăng chương 1', NULL, 1, 1, '2025-12-07 14:54:23'),
(13, 8, 7, 'new_chapter', 'Chương mới: Đấu Phá Thương Khung', 'Đấu Phá Thương Khung mà bạn đang theo dõi vừa đăng chương 1', 99, 1, 1, '2025-12-07 14:57:32'),
(14, 9, 7, 'new_chapter', 'Chương mới: Đấu Phá Thương Khung', 'Đấu Phá Thương Khung mà bạn đang theo dõi vừa đăng chương 1', 99, 1, 1, '2025-12-07 14:57:32'),
(15, 8, 14, 'new_comment', 'Bình luận mới', 'Hưng Khánh đã bình luận trong \"Missile & Plankton\"', NULL, NULL, 0, '2025-12-11 08:53:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','success','failed','expired') DEFAULT 'pending',
  `payment_type` enum('vip_upgrade') DEFAULT 'vip_upgrade',
  `qr_code_url` text DEFAULT NULL,
  `qr_code_data` text DEFAULT NULL,
  `momo_transaction_id` varchar(100) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `order_id`, `amount`, `status`, `payment_type`, `qr_code_url`, `qr_code_data`, `momo_transaction_id`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 9, 'VIP_9_1765124082320', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MDgyMzIw&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MDgyMzIw&v=3.0&sr=0', NULL, '2025-12-07 16:29:42', '2025-12-07 16:14:42', '2025-12-07 16:14:42'),
(2, 9, 'VIP_9_1765124120248', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTIwMjQ4&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTIwMjQ4&v=3.0&sr=0', NULL, '2025-12-07 16:30:20', '2025-12-07 16:15:20', '2025-12-07 16:15:20'),
(3, 9, 'VIP_9_1765124120280', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTIwMjgw&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTIwMjgw&v=3.0&sr=0', NULL, '2025-12-07 16:30:20', '2025-12-07 16:15:20', '2025-12-07 16:15:20'),
(4, 9, 'VIP_9_1765124164092', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTY0MDky&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTY0MDky&v=3.0&sr=0', NULL, '2025-12-07 16:31:04', '2025-12-07 16:16:04', '2025-12-07 16:16:04'),
(5, 9, 'VIP_9_1765124164095', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTY0MDk1&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MTY0MDk1&v=3.0&sr=0', NULL, '2025-12-07 16:31:04', '2025-12-07 16:16:04', '2025-12-07 16:16:04'),
(6, 9, 'VIP_9_1765124229395', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MjI5Mzk1&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MjI5Mzk1&v=3.0&sr=0', NULL, '2025-12-07 16:32:09', '2025-12-07 16:17:09', '2025-12-07 16:17:09'),
(7, 9, 'VIP_9_1765124229398', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MjI5Mzk4&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0MjI5Mzk4&v=3.0&sr=0', NULL, '2025-12-07 16:32:09', '2025-12-07 16:17:09', '2025-12-07 16:17:09'),
(8, 9, 'VIP_9_1765124398300', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0Mzk4MzAw&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0Mzk4MzAw&v=3.0&sr=0', NULL, '2025-12-07 16:34:58', '2025-12-07 16:19:58', '2025-12-07 16:19:58'),
(9, 9, 'VIP_9_1765124406594', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NDA2NTk0&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NDA2NTk0&v=3.0&sr=0', NULL, '2025-12-07 16:35:06', '2025-12-07 16:20:06', '2025-12-07 16:20:06'),
(10, 9, 'VIP_9_1765124406596', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NDA2NTk2&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NDA2NTk2&v=3.0&sr=0', NULL, '2025-12-07 16:35:06', '2025-12-07 16:20:06', '2025-12-07 16:20:06'),
(11, 9, 'VIP_9_1765124574791', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NTc0Nzkx&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NTc0Nzkx&v=3.0&sr=0', NULL, '2025-12-07 16:37:54', '2025-12-07 16:22:54', '2025-12-07 16:22:54'),
(12, 9, 'VIP_9_1765124574795', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NTc0Nzk1&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI0NTc0Nzk1&v=3.0&sr=0', NULL, '2025-12-07 16:37:54', '2025-12-07 16:22:54', '2025-12-07 16:22:54'),
(13, 9, 'VIP_9_1765124611584', 50000.00, 'success', 'vip_upgrade', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_PAYMENT_VIP_9_1765124611584', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_PAYMENT_VIP_9_1765124611584', 'MOCK_1765124622147', '2025-12-07 16:23:42', '2025-12-07 16:23:31', '2025-12-07 16:23:42'),
(15, 9, 'VIP_9_1765125099627', 50000.00, 'pending', 'vip_upgrade', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_PAYMENT_VIP_9_1765125099627', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_PAYMENT_VIP_9_1765125099627', NULL, '2025-12-07 16:46:39', '2025-12-07 16:31:39', '2025-12-07 16:31:39'),
(17, 9, 'VIP_9_1765125153321', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI1MTUzMzIx&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI1MTUzMzIx&v=3.0&sr=0', NULL, '2025-12-07 16:47:33', '2025-12-07 16:32:33', '2025-12-07 16:32:33'),
(18, 9, 'VIP_9_1765125153356', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI1MTUzMzU2&v=3.0&sr=0', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1MTI1MTUzMzU2&v=3.0&sr=0', NULL, '2025-12-07 16:47:33', '2025-12-07 16:32:33', '2025-12-07 16:32:33'),
(19, 9, 'VIP_9_1765540490507', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NTQwNDkwNTA3&v=3.0&sr=0&sig=7754306c4f175be3a4ceb0c320c65fa38208cac1ee19efc25a6b53d9', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NTQwNDkwNTA3&v=3.0&sr=0&sig=7754306c4f175be3a4ceb0c320c65fa38208cac1ee19efc25a6b53d9', NULL, '2025-12-12 12:09:50', '2025-12-12 11:54:50', '2025-12-12 11:54:50'),
(20, 9, 'VIP_9_1765540490579', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NTQwNDkwNTc5&v=3.0&sr=0&sig=9d64f9383698929ce0878ac33e21bdeafec0f67c39e0ee390fd20271', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NTQwNDkwNTc5&v=3.0&sr=0&sig=9d64f9383698929ce0878ac33e21bdeafec0f67c39e0ee390fd20271', NULL, '2025-12-12 12:09:50', '2025-12-12 11:54:50', '2025-12-12 11:54:50'),
(21, 9, 'VIP_9_1765689222956', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5MjIyOTU2&v=3.0&sr=0&sig=fcf03ab4c2b7329d69b6690fa2bd12afa7e8112fe25b865b9c6faa61', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5MjIyOTU2&v=3.0&sr=0&sig=fcf03ab4c2b7329d69b6690fa2bd12afa7e8112fe25b865b9c6faa61', NULL, '2025-12-14 05:28:42', '2025-12-14 05:13:43', '2025-12-14 05:13:43'),
(22, 9, 'VIP_9_1765689222909', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5MjIyOTA5&v=3.0&sr=0&sig=48c0796d143cc74e3f71d598d78ed1a6ba8f74fcc2d532a8e1a9f3fa', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5MjIyOTA5&v=3.0&sr=0&sig=48c0796d143cc74e3f71d598d78ed1a6ba8f74fcc2d532a8e1a9f3fa', NULL, '2025-12-14 05:28:42', '2025-12-14 05:13:43', '2025-12-14 05:13:43'),
(23, 9, 'VIP_9_1765689535444', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM1NDQ0&v=3.0&sr=0&sig=3025f49b153c1412360b41bb4ae29cd406a8e94f8c2bc34720d3ef0c', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM1NDQ0&v=3.0&sr=0&sig=3025f49b153c1412360b41bb4ae29cd406a8e94f8c2bc34720d3ef0c', NULL, '2025-12-14 05:33:55', '2025-12-14 05:18:55', '2025-12-14 05:18:55'),
(24, 9, 'VIP_9_1765689535447', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM1NDQ3&v=3.0&sr=0&sig=d35217ded66c8d57880fea4673e3ca808b3cf7f684a2adca4f627877', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM1NDQ3&v=3.0&sr=0&sig=d35217ded66c8d57880fea4673e3ca808b3cf7f684a2adca4f627877', NULL, '2025-12-14 05:33:55', '2025-12-14 05:18:55', '2025-12-14 05:18:55'),
(25, 9, 'VIP_9_1765689539322', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM5MzIy&v=3.0&sr=0&sig=6a588c992268871b5a43c49d77ba2f5eace11778209d75045ea7f190', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM5MzIy&v=3.0&sr=0&sig=6a588c992268871b5a43c49d77ba2f5eace11778209d75045ea7f190', NULL, '2025-12-14 05:33:59', '2025-12-14 05:18:59', '2025-12-14 05:18:59'),
(26, 9, 'VIP_9_1765689539320', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM5MzIw&v=3.0&sr=0&sig=d6684e8590452f5f548a87c196e4dde967895f76c8b2de7897518c9a', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1Njg5NTM5MzIw&v=3.0&sr=0&sig=d6684e8590452f5f548a87c196e4dde967895f76c8b2de7897518c9a', NULL, '2025-12-14 05:33:59', '2025-12-14 05:18:59', '2025-12-14 05:18:59'),
(27, 9, 'VIP_9_1765690017145', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMDE3MTQ1&v=3.0&sr=0&sig=1750f8fbf85235455ae9b5cfeb597a6fb425dc3c9b52f962b0dbbd81', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMDE3MTQ1&v=3.0&sr=0&sig=1750f8fbf85235455ae9b5cfeb597a6fb425dc3c9b52f962b0dbbd81', NULL, '2025-12-14 05:41:57', '2025-12-14 05:26:57', '2025-12-14 05:26:57'),
(28, 9, 'VIP_9_1765690017175', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMDE3MTc1&v=3.0&sr=0&sig=2329040e4bad267145ee407c9ab31c18f514401b8992758523b7756c', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMDE3MTc1&v=3.0&sr=0&sig=2329040e4bad267145ee407c9ab31c18f514401b8992758523b7756c', NULL, '2025-12-14 05:41:57', '2025-12-14 05:26:57', '2025-12-14 05:26:57'),
(29, 9, 'VIP_9_1765690217135', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMjE3MTM1&v=3.0&sr=0&sig=4e452200b65279753f3664f2bb79b7bcdfbbc614385967c33183b1b4', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMjE3MTM1&v=3.0&sr=0&sig=4e452200b65279753f3664f2bb79b7bcdfbbc614385967c33183b1b4', NULL, '2025-12-14 05:45:17', '2025-12-14 05:30:17', '2025-12-14 05:30:17'),
(30, 9, 'VIP_9_1765690217132', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMjE3MTMy&v=3.0&sr=0&sig=c17d836369f996870fdc246c061ae51a83cac3d1348125ef63d39ad4', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwMjE3MTMy&v=3.0&sr=0&sig=c17d836369f996870fdc246c061ae51a83cac3d1348125ef63d39ad4', NULL, '2025-12-14 05:45:17', '2025-12-14 05:30:17', '2025-12-14 05:30:17'),
(31, 9, 'VIP_9_1765690406884', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDA2ODg0&v=3.0&sr=0&sig=78fece77ca8550c1cc4b1528da7fb4154ef6cfc26b129bb89ca9df99', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDA2ODg0&v=3.0&sr=0&sig=78fece77ca8550c1cc4b1528da7fb4154ef6cfc26b129bb89ca9df99', NULL, '2025-12-14 05:48:26', '2025-12-14 05:33:26', '2025-12-14 05:33:26'),
(32, 9, 'VIP_9_1765690406882', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDA2ODgy&v=3.0&sr=0&sig=7cf2e409fd23cf672fcd752e337d605fdb05c3e0c82567f1a9785550', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDA2ODgy&v=3.0&sr=0&sig=7cf2e409fd23cf672fcd752e337d605fdb05c3e0c82567f1a9785550', NULL, '2025-12-14 05:48:26', '2025-12-14 05:33:26', '2025-12-14 05:33:26'),
(33, 9, 'VIP_9_1765690430226', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDMwMjI2&v=3.0&sr=0&sig=28fbd3b47b237814cb9f75490a240ec1ad3fef67ea7dae77e212b7c1', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDMwMjI2&v=3.0&sr=0&sig=28fbd3b47b237814cb9f75490a240ec1ad3fef67ea7dae77e212b7c1', NULL, '2025-12-14 05:48:50', '2025-12-14 05:33:50', '2025-12-14 05:33:50'),
(34, 9, 'VIP_9_1765690430227', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDMwMjI3&v=3.0&sr=0&sig=e7c3b162c84db27809efed7d4073a38a15abbe41eddef5e145f1a353', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDMwMjI3&v=3.0&sr=0&sig=e7c3b162c84db27809efed7d4073a38a15abbe41eddef5e145f1a353', NULL, '2025-12-14 05:48:50', '2025-12-14 05:33:50', '2025-12-14 05:33:50'),
(35, 9, 'VIP_9_1765690499936', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDk5OTM2&v=3.0&sr=0&sig=442ab9b77e315a20c998e87946cfedb86604166ea370f616211675b8', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDk5OTM2&v=3.0&sr=0&sig=442ab9b77e315a20c998e87946cfedb86604166ea370f616211675b8', NULL, '2025-12-14 05:49:59', '2025-12-14 05:34:59', '2025-12-14 05:34:59'),
(36, 9, 'VIP_9_1765690499939', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDk5OTM5&v=3.0&sr=0&sig=305f88c63b415593ec8fda9aac48d8bb0148a180c5c36b4302874688', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNDk5OTM5&v=3.0&sr=0&sig=305f88c63b415593ec8fda9aac48d8bb0148a180c5c36b4302874688', NULL, '2025-12-14 05:49:59', '2025-12-14 05:34:59', '2025-12-14 05:34:59'),
(37, 9, 'VIP_9_1765690753548', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNzUzNTQ4&v=3.0&sr=0&sig=b81f513904509984f8db38b1282ab7c5ee877bfeff7e6f98bfca1c74', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNzUzNTQ4&v=3.0&sr=0&sig=b81f513904509984f8db38b1282ab7c5ee877bfeff7e6f98bfca1c74', NULL, '2025-12-14 05:54:13', '2025-12-14 05:39:13', '2025-12-14 05:39:13'),
(38, 9, 'VIP_9_1765690753582', 50000.00, 'success', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNzUzNTgy&v=3.0&sr=0&sig=13a9e87387e2d57e2d2c477c62be08777e9a96795a6c56ed810267fd', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwNzUzNTgy&v=3.0&sr=0&sig=13a9e87387e2d57e2d2c477c62be08777e9a96795a6c56ed810267fd', '4628962834', '2025-12-14 05:39:44', '2025-12-14 05:39:13', '2025-12-14 05:39:44'),
(39, 9, 'VIP_9_1765690850530', 50000.00, 'pending', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwODUwNTMw&v=3.0&sr=0&sig=5c471365d9481349d14bfd50f5876254817c07998477164a084bbb44', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwODUwNTMw&v=3.0&sr=0&sig=5c471365d9481349d14bfd50f5876254817c07998477164a084bbb44', NULL, '2025-12-14 05:55:50', '2025-12-14 05:40:50', '2025-12-14 05:40:50'),
(40, 9, 'VIP_9_1765690850527', 50000.00, 'success', 'vip_upgrade', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwODUwNTI3&v=3.0&sr=0&sig=2471a424bde576021d02c41d6574c7822e80068535df3afa3c25a47a', 'momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3xWSVBfOV8xNzY1NjkwODUwNTI3&v=3.0&sr=0&sig=2471a424bde576021d02c41d6574c7822e80068535df3afa3c25a47a', '4628953404', '2025-12-14 05:41:20', '2025-12-14 05:40:50', '2025-12-14 05:41:20');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reading_history`
--

CREATE TABLE `reading_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comic_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `last_read_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `reading_history`
--

INSERT INTO `reading_history` (`id`, `user_id`, `comic_id`, `chapter_id`, `last_read_at`, `created_at`) VALUES
(33, 9, 7, 99, '2025-12-07 14:57:55', '2025-12-07 14:57:55'),
(36, 8, 8, 14, '2025-12-12 19:12:52', '2025-12-12 19:12:52');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `role` enum('reader','vip','admin') DEFAULT 'reader',
  `account_status` enum('active','locked','banned') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email_verified` tinyint(1) DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `email_verification_token` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `avatar`, `role`, `account_status`, `created_at`, `updated_at`, `email_verified`, `google_id`) VALUES
(8, '1305 Khánh Hưng', 'khanhhungbadong@gmail.com', '$2a$10$fepC/E1QV5f3QKijxDvvjOfN7kjTEFjdk98MKiSFE1KH8y/UyWoyO', 'https://lh3.googleusercontent.com/a/ACg8ocKpJ9l6vNI4WgH9s62HZ7l-MMJoxXwkxwiXbN9WGAUpjlt43_TY=s96-c', 'admin', 'active', '2025-12-07 14:48:40', '2025-12-07 14:52:45', 1, '101941195377391549777'),
(9, 'Khanh Hung', 'nkhung2004@gmail.com', '$2a$10$zQJSLKAyWHMMRu1NX43Kq.FPNsSm65swWmQ0u8/nXDIrZB/yUTGcy', 'https://lh3.googleusercontent.com/a/ACg8ocIfixLuaKA1eZist-rFMdQhD6C7pjD8StWaz917UXhI_GL6hg=s96-c', 'reader', 'active', '2025-12-07 14:52:10', '2025-12-14 05:41:58', 1, '109972343414933221860');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `chapters`
--
ALTER TABLE `chapters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_comic_chapter` (`comic_id`,`chapter_number`),
  ADD KEY `idx_comic_id` (`comic_id`),
  ADD KEY `idx_chapter_number` (`chapter_number`);

--
-- Chỉ mục cho bảng `comics`
--
ALTER TABLE `comics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_views` (`views`),
  ADD KEY `idx_updated_at` (`updated_at`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_country_id` (`country_id`);

--
-- Chỉ mục cho bảng `comic_categories`
--
ALTER TABLE `comic_categories`
  ADD PRIMARY KEY (`comic_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_comic_id` (`comic_id`),
  ADD KEY `idx_chapter_id` (`chapter_id`),
  ADD KEY `idx_parent_id` (`parent_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_likes_count` (`likes_count`);

--
-- Chỉ mục cho bảng `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_comment_like` (`user_id`,`comment_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_comment_id` (`comment_id`);

--
-- Chỉ mục cho bảng `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_comic` (`user_id`,`comic_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_comic_id` (`comic_id`);

--
-- Chỉ mục cho bảng `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_comic_like` (`user_id`,`comic_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_comic_id` (`comic_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comic_id` (`comic_id`),
  ADD KEY `chapter_id` (`chapter_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Chỉ mục cho bảng `reading_history`
--
ALTER TABLE `reading_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_comic_history` (`user_id`,`comic_id`),
  ADD KEY `chapter_id` (`chapter_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_comic_id` (`comic_id`),
  ADD KEY `idx_last_read_at` (`last_read_at`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_google_id` (`google_id`),
  ADD KEY `idx_email_verification_token` (`email_verification_token`),
  ADD KEY `idx_password_reset_token` (`password_reset_token`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `chapters`
--
ALTER TABLE `chapters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT cho bảng `comics`
--
ALTER TABLE `comics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT cho bảng `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `comment_likes`
--
ALTER TABLE `comment_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT cho bảng `reading_history`
--
ALTER TABLE `reading_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `chapters`
--
ALTER TABLE `chapters`
  ADD CONSTRAINT `chapters_ibfk_1` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `comics`
--
ALTER TABLE `comics`
  ADD CONSTRAINT `comics_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `comic_categories`
--
ALTER TABLE `comic_categories`
  ADD CONSTRAINT `comic_categories_ibfk_1` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comic_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_4` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `reading_history`
--
ALTER TABLE `reading_history`
  ADD CONSTRAINT `reading_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reading_history_ibfk_2` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reading_history_ibfk_3` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
