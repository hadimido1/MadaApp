import { StoreProduct } from '../types';
import gpImg from '../assets/images/google_play_card_1781796327976.jpg';
import psImg from '../assets/images/playstation_card_1781796346257.jpg';
import stImg from '../assets/images/steam_card_1781796380895.jpg';
import xbImg from '../assets/images/xbox_card_1781796363132.jpg';
import amzImg from '../assets/images/amazon_card_1781796396904.jpg';
import pubgImg from '../assets/images/pubg_card_1781796415094.jpg';
import ffImg from '../assets/images/free_fire_card_1781796432583.jpg';
import rblxImg from '../assets/images/roblox_card_1781796452077.jpg';
import sheinImg from '../assets/images/shein_card_1781797606028.jpg';

export const STORE_PRODUCTS: StoreProduct[] = [
  // Gift Cards
  {
    id: 'google_play',
    name: 'Google Play',
    category: 'giftcard',
    brand: 'google_play',
    image: gpImg,
    packages: [
      { id: 'gp-5', name: 'Google Play $5', originalPrice: 5, discountedPrice: 4 },
      { id: 'gp-10', name: 'Google Play $10', originalPrice: 10, discountedPrice: 8 },
      { id: 'gp-15', name: 'Google Play $15', originalPrice: 15, discountedPrice: 12 },
      { id: 'gp-25', name: 'Google Play $25', originalPrice: 25, discountedPrice: 20 },
      { id: 'gp-50', name: 'Google Play $50', originalPrice: 50, discountedPrice: 40 },
      { id: 'gp-100', name: 'Google Play $100', originalPrice: 100, discountedPrice: 80 }
    ]
  },
  {
    id: 'playstation',
    name: 'PlayStation Store',
    category: 'giftcard',
    brand: 'playstation',
    image: psImg,
    packages: [
      { id: 'ps-5', name: 'PlayStation $5', originalPrice: 5, discountedPrice: 4 },
      { id: 'ps-10', name: 'PlayStation $10', originalPrice: 10, discountedPrice: 8 },
      { id: 'ps-15', name: 'PlayStation $15', originalPrice: 15, discountedPrice: 12 },
      { id: 'ps-25', name: 'PlayStation $25', originalPrice: 25, discountedPrice: 20 },
      { id: 'ps-50', name: 'PlayStation $50', originalPrice: 50, discountedPrice: 40 },
      { id: 'ps-100', name: 'PlayStation $100', originalPrice: 100, discountedPrice: 80 }
    ]
  },
  {
    id: 'steam',
    name: 'Steam Wallet',
    category: 'giftcard',
    brand: 'steam',
    image: stImg,
    packages: [
      { id: 'st-5', name: 'Steam $5', originalPrice: 5, discountedPrice: 4 },
      { id: 'st-10', name: 'Steam $10', originalPrice: 10, discountedPrice: 8 },
      { id: 'st-15', name: 'Steam $15', originalPrice: 15, discountedPrice: 12 },
      { id: 'st-25', name: 'Steam $25', originalPrice: 25, discountedPrice: 20 },
      { id: 'st-50', name: 'Steam $50', originalPrice: 50, discountedPrice: 40 },
      { id: 'st-100', name: 'Steam $100', originalPrice: 100, discountedPrice: 80 }
    ]
  },
  {
    id: 'xbox',
    name: 'Xbox Live & Game Pass',
    category: 'giftcard',
    brand: 'xbox',
    image: xbImg,
    packages: [
      { id: 'xb-5', name: 'Xbox $5', originalPrice: 5, discountedPrice: 4 },
      { id: 'xb-10', name: 'Xbox $10', originalPrice: 10, discountedPrice: 8 },
      { id: 'xb-15', name: 'Xbox $15', originalPrice: 15, discountedPrice: 12 },
      { id: 'xb-25', name: 'Xbox $25', originalPrice: 25, discountedPrice: 20 },
      { id: 'xb-50', name: 'Xbox $50', originalPrice: 50, discountedPrice: 40 },
      { id: 'xb-100', name: 'Xbox $100', originalPrice: 100, discountedPrice: 80 }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon Gift Card',
    category: 'giftcard',
    brand: 'amazon',
    image: amzImg,
    packages: [
      { id: 'amz-5', name: 'Amazon $5', originalPrice: 5, discountedPrice: 4 },
      { id: 'amz-10', name: 'Amazon $10', originalPrice: 10, discountedPrice: 8 },
      { id: 'amz-15', name: 'Amazon $15', originalPrice: 15, discountedPrice: 12 },
      { id: 'amz-25', name: 'Amazon $25', originalPrice: 25, discountedPrice: 20 },
      { id: 'amz-50', name: 'Amazon $50', originalPrice: 50, discountedPrice: 40 },
      { id: 'amz-100', name: 'Amazon $100', originalPrice: 100, discountedPrice: 80 }
    ]
  },
  {
    id: 'shein',
    name: 'SHEIN Gift Card',
    category: 'giftcard',
    brand: 'shein',
    image: sheinImg,
    packages: [
      { id: 'shein-10', name: 'SHEIN $10', originalPrice: 10, discountedPrice: 8 },
      { id: 'shein-25', name: 'SHEIN $25', originalPrice: 25, discountedPrice: 20 },
      { id: 'shein-50', name: 'SHEIN $50', originalPrice: 50, discountedPrice: 40 },
      { id: 'shein-100', name: 'SHEIN $100', originalPrice: 100, discountedPrice: 80 }
    ]
  },
  
  // Game Top-ups
  {
    id: 'pubg',
    name: 'PUBG Mobile UC',
    category: 'game_topup',
    brand: 'pubg',
    image: pubgImg,
    packages: [
      { id: 'pubg-60', name: '60 UC', originalPrice: 0.99, discountedPrice: 0.80 },
      { id: 'pubg-325', name: '325 UC', originalPrice: 4.99, discountedPrice: 4.00 },
      { id: 'pubg-660', name: '660 UC', originalPrice: 9.99, discountedPrice: 8.00 },
      { id: 'pubg-1800', name: '1800 UC', originalPrice: 24.99, discountedPrice: 20.00 },
      { id: 'pubg-3850', name: '3850 UC', originalPrice: 49.99, discountedPrice: 40.00 },
      { id: 'pubg-8100', name: '8100 UC', originalPrice: 99.99, discountedPrice: 80.00 }
    ]
  },
  {
    id: 'free_fire',
    name: 'Free Fire Diamonds',
    category: 'game_topup',
    brand: 'free_fire',
    image: ffImg,
    packages: [
      { id: 'ff-100', name: '100 Diamonds', originalPrice: 0.99, discountedPrice: 0.80 },
      { id: 'ff-530', name: '530 Diamonds', originalPrice: 4.99, discountedPrice: 4.00 },
      { id: 'ff-1080', name: '1080 Diamonds', originalPrice: 9.99, discountedPrice: 8.00 },
      { id: 'ff-2200', name: '2200 Diamonds', originalPrice: 24.99, discountedPrice: 20.00 },
      { id: 'ff-5600', name: '5600 Diamonds', originalPrice: 49.99, discountedPrice: 40.00 },
      { id: 'ff-11200', name: '11200 Diamonds', originalPrice: 99.99, discountedPrice: 80.00 }
    ]
  },
  {
    id: 'roblox',
    name: 'Roblox Robux',
    category: 'game_topup',
    brand: 'roblox',
    image: rblxImg,
    packages: [
      { id: 'rblx-80', name: '80 Robux', originalPrice: 0.99, discountedPrice: 0.80 },
      { id: 'rblx-400', name: '400 Robux', originalPrice: 4.99, discountedPrice: 4.00 },
      { id: 'rblx-800', name: '800 Robux', originalPrice: 9.99, discountedPrice: 8.00 },
      { id: 'rblx-2000', name: '2000 Robux', originalPrice: 24.99, discountedPrice: 20.00 },
      { id: 'rblx-4500', name: '4500 Robux', originalPrice: 49.99, discountedPrice: 40.00 },
      { id: 'rblx-10000', name: '10000 Robux', originalPrice: 99.99, discountedPrice: 80.00 }
    ]
  }
];
