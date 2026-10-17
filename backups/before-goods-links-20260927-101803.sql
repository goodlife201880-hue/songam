-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: songam_restaurant
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `food_ingredients`
--

DROP TABLE IF EXISTS `food_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `food_ingredients` (
  `food_id` int(10) unsigned NOT NULL,
  `material_id` int(10) unsigned NOT NULL,
  `quantity` decimal(11,3) NOT NULL,
  `unit` varchar(12) NOT NULL,
  PRIMARY KEY (`food_id`,`material_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `food_ingredients_ibfk_1` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `food_ingredients_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `food_ingredients`
--

LOCK TABLES `food_ingredients` WRITE;
/*!40000 ALTER TABLE `food_ingredients` DISABLE KEYS */;
INSERT INTO `food_ingredients` VALUES (2,1,123.000,'kg'),(2,2,10.000,'g');
/*!40000 ALTER TABLE `food_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foods`
--

DROP TABLE IF EXISTS `foods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `foods` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `serving_price` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foods`
--

LOCK TABLES `foods` WRITE;
/*!40000 ALTER TABLE `foods` DISABLE KEYS */;
INSERT INTO `foods` VALUES (2,'beaf food',10.000,'USD');
/*!40000 ALTER TABLE `foods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods`
--

DROP TABLE IF EXISTS `goods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goods` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `unit` varchar(12) NOT NULL,
  `unit_cost` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL DEFAULT 'USD',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `goods_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `goods_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods`
--

LOCK TABLES `goods` WRITE;
/*!40000 ALTER TABLE `goods` DISABLE KEYS */;
INSERT INTO `goods` VALUES (2,'beer',2,'L',1.000,'USD');
/*!40000 ALTER TABLE `goods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_categories`
--

DROP TABLE IF EXISTS `goods_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goods_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_categories`
--

LOCK TABLES `goods_categories` WRITE;
/*!40000 ALTER TABLE `goods_categories` DISABLE KEYS */;
INSERT INTO `goods_categories` VALUES (2,'drink');
/*!40000 ALTER TABLE `goods_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_import_items`
--

DROP TABLE IF EXISTS `goods_import_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goods_import_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `import_id` int(10) unsigned NOT NULL,
  `name` varchar(120) NOT NULL,
  `quantity` decimal(11,3) NOT NULL,
  `total_cost` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `import_id` (`import_id`),
  CONSTRAINT `goods_import_items_ibfk_1` FOREIGN KEY (`import_id`) REFERENCES `goods_imports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_import_items`
--

LOCK TABLES `goods_import_items` WRITE;
/*!40000 ALTER TABLE `goods_import_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_import_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_imports`
--

DROP TABLE IF EXISTS `goods_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goods_imports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `imported_on` date NOT NULL,
  `recorded_by` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_imports`
--

LOCK TABLES `goods_imports` WRITE;
/*!40000 ALTER TABLE `goods_imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_usage`
--

DROP TABLE IF EXISTS `goods_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goods_usage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `goods_id` int(10) unsigned NOT NULL,
  `used_on` date NOT NULL,
  `quantity` decimal(11,3) NOT NULL,
  `unit_cost` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL DEFAULT 'USD',
  `note` varchar(250) NOT NULL DEFAULT '',
  `recorded_by` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `used_on` (`used_on`,`goods_id`),
  KEY `goods_id` (`goods_id`),
  CONSTRAINT `goods_usage_ibfk_1` FOREIGN KEY (`goods_id`) REFERENCES `goods` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_usage`
--

LOCK TABLES `goods_usage` WRITE;
/*!40000 ALTER TABLE `goods_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `management_lock`
--

DROP TABLE IF EXISTS `management_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `management_lock` (
  `id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `management_lock`
--

LOCK TABLES `management_lock` WRITE;
/*!40000 ALTER TABLE `management_lock` DISABLE KEYS */;
INSERT INTO `management_lock` VALUES (1);
/*!40000 ALTER TABLE `management_lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_categories`
--

DROP TABLE IF EXISTS `material_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_categories`
--

LOCK TABLES `material_categories` WRITE;
/*!40000 ALTER TABLE `material_categories` DISABLE KEYS */;
INSERT INTO `material_categories` VALUES (1,'meat'),(2,'vegetable');
/*!40000 ALTER TABLE `material_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_import_items`
--

DROP TABLE IF EXISTS `material_import_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_import_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `import_id` int(10) unsigned NOT NULL,
  `material_id` int(10) unsigned NOT NULL,
  `material_name` varchar(120) NOT NULL,
  `quantity` decimal(11,3) NOT NULL,
  `unit` varchar(12) NOT NULL,
  `total_cost` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `import_id` (`import_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `material_import_items_ibfk_1` FOREIGN KEY (`import_id`) REFERENCES `material_imports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `material_import_items_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_import_items`
--

LOCK TABLES `material_import_items` WRITE;
/*!40000 ALTER TABLE `material_import_items` DISABLE KEYS */;
INSERT INTO `material_import_items` VALUES (3,2,1,'beaf',123.000,'g',123.000,'KRW'),(4,2,1,'beaf',123.000,'g',123.000,'USD');
/*!40000 ALTER TABLE `material_import_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_imports`
--

DROP TABLE IF EXISTS `material_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_imports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `imported_on` date NOT NULL,
  `recorded_by` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_imports`
--

LOCK TABLES `material_imports` WRITE;
/*!40000 ALTER TABLE `material_imports` DISABLE KEYS */;
INSERT INTO `material_imports` VALUES (2,'2026-09-27',1,'2026-09-27 14:03:32');
/*!40000 ALTER TABLE `material_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_usage`
--

DROP TABLE IF EXISTS `material_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_usage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `material_id` int(10) unsigned NOT NULL,
  `used_on` date NOT NULL,
  `quantity` decimal(11,3) NOT NULL,
  `unit_cost` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL DEFAULT 'USD',
  `note` varchar(250) NOT NULL DEFAULT '',
  `recorded_by` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `used_on` (`used_on`,`material_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `material_usage_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_usage`
--

LOCK TABLES `material_usage` WRITE;
/*!40000 ALTER TABLE `material_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `materials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `unit` varchar(12) NOT NULL,
  `unit_cost` decimal(11,3) NOT NULL,
  `currency` enum('USD','KRW') NOT NULL DEFAULT 'USD',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `materials_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `material_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materials`
--

LOCK TABLES `materials` WRITE;
/*!40000 ALTER TABLE `materials` DISABLE KEYS */;
INSERT INTO `materials` VALUES (1,'beaf',1,'kg',200.000,'USD'),(2,'garlic',2,'g',10000.000,'USD'),(4,'rsg',1,'kg',3000.000,'USD');
/*!40000 ALTER TABLE `materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `token_hash` char(64) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('81afc80da1e2a1d7be33ca70945f4d86db62827651f31ed43b39209d3a0bcda4',1,'2026-09-27 20:17:09'),('ea79244f1f85b4fb451aa639043e876d8b2eca2cfc7aacffea214940b1c1d5bc',1,'2026-09-27 18:29:56');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_abilities`
--

DROP TABLE IF EXISTS `user_abilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_abilities` (
  `user_id` int(10) unsigned NOT NULL,
  `abilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`abilities`)),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_abilities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_abilities`
--

LOCK TABLES `user_abilities` WRITE;
/*!40000 ALTER TABLE `user_abilities` DISABLE KEYS */;
INSERT INTO `user_abilities` VALUES (1,'[\"users\", \"materials\", \"food\", \"imports\", \"exports\", \"goods\"]');
/*!40000 ALTER TABLE `user_abilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_logs`
--

DROP TABLE IF EXISTS `user_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `actor` varchar(254) NOT NULL,
  `action` varchar(30) NOT NULL,
  `subject` varchar(254) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_logs`
--

LOCK TABLES `user_logs` WRITE;
/*!40000 ALTER TABLE `user_logs` DISABLE KEYS */;
INSERT INTO `user_logs` VALUES (1,'Local setup','Created user','manager@example.com','2026-09-27 09:10:01'),(2,'manager@example.com','Updated user','rsg@email.com','2026-09-27 09:12:40');
/*!40000 ALTER TABLE `user_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(200) NOT NULL,
  `job` enum('cooker','manager','worker','servicer','guider') NOT NULL,
  `birthday` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'rsg','rsg@email.com','6d382eecccb774c12598f8301300815b:3c7046070756331f162eeb513b9dffe8f9cb01906ec30b5e4ca8324ddc3b379b5b6a6cf7702c0092422a846201dbf910e78dd6b5317eb12586d09b6a00ced83a','manager','2006-01-17');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-27 10:18:04
