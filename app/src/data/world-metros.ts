/**
 * SIVRCE — World metro / urban rail catalog (programmatic SEO).
 * Comprehensive data for 100+ metro systems across all continents.
 * Station coordinates sourced from OSM / official operator data.
 *
 * ponytail: main interchange stations included; expand per-city as needed.
 */

export type MetroStation = {
  slug: string
  name: string
  nameKa: string
  lat: number
  lng: number
  line: string
  citySlug: string
  cc: string
  yearOpened?: number
  interchange?: boolean
}

export type MetroLine = {
  name: string
  color: string
  stations: number
  km: number
  yearOpened: number
}

export type MetroSystemData = {
  citySlug: string
  cc: string
  name: string
  lines: MetroLine[]
  stations: MetroStation[]
  totalKm: number
  totalStations: number
  yearOpened: number
  dailyRidership: number
  status: 'operational' | 'under-construction' | 'planned'
}

// ────────────────────────────────────────────────────────────────
// ASIA — JAPAN
// ────────────────────────────────────────────────────────────────

const tokyoMetro: MetroSystemData = {
  citySlug: 'tokyo',
  cc: 'JP',
  name: 'Tokyo Metro',
  status: 'operational',
  totalKm: 195.0,
  totalStations: 180,
  yearOpened: 1927,
  dailyRidership: 6_880_000,
  lines: [
    { name: 'Ginza Line', color: '#F5A623', stations: 19, km: 14.3, yearOpened: 1927 },
    { name: 'Marunouchi Line', color: '#E5171F', stations: 25, km: 27.4, yearOpened: 1954 },
    { name: 'Hibiya Line', color: '#B3B3B3', stations: 21, km: 20.3, yearOpened: 1961 },
    { name: 'Tozai Line', color: '#009944', stations: 23, km: 30.8, yearOpened: 1969 },
    { name: 'Chiyoda Line', color: '#00B14F', stations: 20, km: 24.0, yearOpened: 1972 },
    { name: 'Yurakucho Line', color: '#9B7CB6', stations: 24, km: 28.3, yearOpened: 1974 },
    { name: 'Hanzomon Line', color: '#8B6DB2', stations: 14, km: 14.3, yearOpened: 1978 },
    { name: 'Namboku Line', color: '#00ADA9', stations: 19, km: 21.3, yearOpened: 1991 },
    { name: 'Fukutoshin Line', color: '#9C7D5E', stations: 16, km: 15.0, yearOpened: 2008 },
  ],
  stations: [
    { slug: 'shibuya', name: 'Shibuya', nameKa: 'shibuya', lat: 35.6580, lng: 139.7016, line: 'Ginza / Hanzomon / Fukutoshin', citySlug: 'tokyo', cc: 'JP', yearOpened: 1938, interchange: true },
    { slug: 'shinjuku', name: 'Shinjuku', nameKa: 'shinjuku', lat: 35.6896, lng: 139.7006, line: 'Marunouchi', citySlug: 'tokyo', cc: 'JP', yearOpened: 1959, interchange: true },
    { slug: 'tokyo-station', name: 'Tokyo', nameKa: 'tokyo', lat: 35.6812, lng: 139.7671, line: 'Marunouchi', citySlug: 'tokyo', cc: 'JP', yearOpened: 1954, interchange: true },
    { slug: 'ikebukuro', name: 'Ikebukuro', nameKa: 'ikebukuro', lat: 35.7295, lng: 139.7109, line: 'Marunouchi / Yurakucho / Fukutoshin', citySlug: 'tokyo', cc: 'JP', yearOpened: 1954, interchange: true },
    { slug: 'akihabara', name: 'Akihabara', nameKa: 'akihabara', lat: 35.6984, lng: 139.7731, line: 'Hibiya', citySlug: 'tokyo', cc: 'JP', yearOpened: 1962, interchange: true },
    { slug: 'ginza', name: 'Ginza', nameKa: 'ginza', lat: 35.6717, lng: 139.7649, line: 'Ginza / Hibiya / Marunouchi', citySlug: 'tokyo', cc: 'JP', yearOpened: 1927, interchange: true },
    { slug: 'ueno', name: 'Ueno', nameKa: 'ueno', lat: 35.7141, lng: 139.7774, line: 'Ginza / Hibiya', citySlug: 'tokyo', cc: 'JP', yearOpened: 1927, interchange: true },
    { slug: 'roppongi', name: 'Roppongi', nameKa: 'roppongi', lat: 35.6632, lng: 139.7312, line: 'Hibiya / Oedo', citySlug: 'tokyo', cc: 'JP', yearOpened: 1973, interchange: true },
    { slug: 'nagatacho', name: 'Nagatacho', nameKa: 'nagatacho', lat: 35.6786, lng: 139.7372, line: 'Yurakucho / Hanzomon / Namboku', citySlug: 'tokyo', cc: 'JP', yearOpened: 1974, interchange: true },
    { slug: 'kasumigaseki', name: 'Kasumigaseki', nameKa: 'kasumigaseki', lat: 35.6735, lng: 139.7568, line: 'Ginza / Marunouchi / Hibiya', citySlug: 'tokyo', cc: 'JP', yearOpened: 1958, interchange: true },
  ],
}

const tokyoToei: MetroSystemData = {
  citySlug: 'tokyo-toei',
  cc: 'JP',
  name: 'Toei Subway',
  status: 'operational',
  totalKm: 109.0,
  totalStations: 99,
  yearOpened: 1960,
  dailyRidership: 2_850_000,
  lines: [
    { name: 'Asakusa Line', color: '#005CAC', stations: 20, km: 20.2, yearOpened: 1960 },
    { name: 'Mita Line', color: '#0079BE', stations: 28, km: 26.5, yearOpened: 1968 },
    { name: 'Shinjuku Line', color: '#6CBB5C', stations: 21, km: 23.5, yearOpened: 1978 },
    { name: 'Oedo Line', color: '#CC5A2D', stations: 38, km: 40.7, yearOpened: 1991 },
    { name: 'Nippori-Toneri Line', color: '#C1A87D', stations: 16, km: 12.5, yearOpened: 2008 },
  ],
  stations: [
    { slug: 'ryogoku', name: 'Ryogoku', nameKa: 'ryogoku', lat: 35.6967, lng: 139.7967, line: 'Oedo', citySlug: 'tokyo', cc: 'JP', yearOpened: 1991, interchange: true },
    { slug: 'shinjuku-toei', name: 'Shinjuku', nameKa: 'shinjuku', lat: 35.6938, lng: 139.7036, line: 'Shinjuku', citySlug: 'tokyo', cc: 'JP', yearOpened: 1978, interchange: true },
    { slug: 'shinagawa', name: 'Shinagawa', nameKa: 'shinagawa', lat: 35.6284, lng: 139.7388, line: 'Asakusa', citySlug: 'tokyo', cc: 'JP', yearOpened: 1968, interchange: true },
  ],
}

const jrYamanote: MetroSystemData = {
  citySlug: 'tokyo-jr',
  cc: 'JP',
  name: 'JR Yamanote Line',
  status: 'operational',
  totalKm: 34.5,
  totalStations: 30,
  yearOpened: 1925,
  dailyRidership: 3_540_000,
  lines: [
    { name: 'Yamanote Line', color: '#9ACD32', stations: 30, km: 34.5, yearOpened: 1925 },
  ],
  stations: [
    { slug: 'shibuya-yamanote', name: 'Shibuya', nameKa: 'shibuya', lat: 35.6580, lng: 139.7016, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'shinjuku-yamanote', name: 'Shinjuku', nameKa: 'shinjuku', lat: 35.6896, lng: 139.7006, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'tokyo-yamanote', name: 'Tokyo', nameKa: 'tokyo', lat: 35.6812, lng: 139.7671, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'ikebukuro-yamanote', name: 'Ikebukuro', nameKa: 'ikebukuro', lat: 35.7295, lng: 139.7109, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'ueno-yamanote', name: 'Ueno', nameKa: 'ueno', lat: 35.7141, lng: 139.7774, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'shinagawa-yamanote', name: 'Shinagawa', nameKa: 'shinagawa', lat: 35.6284, lng: 139.7388, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'harajuku', name: 'Harajuku', nameKa: 'harajuku', lat: 35.6702, lng: 139.7027, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: false },
    { slug: 'ebisu', name: 'Ebisu', nameKa: 'ebisu', lat: 35.6467, lng: 139.7100, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1901, interchange: false },
    { slug: 'meguro', name: 'Meguro', nameKa: 'meguro', lat: 35.6339, lng: 139.7158, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1925, interchange: true },
    { slug: 'yoyogi', name: 'Yoyogi', nameKa: 'yoyogi', lat: 35.6833, lng: 139.7021, line: 'Yamanote', citySlug: 'tokyo', cc: 'JP', yearOpened: 1906, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — SOUTH KOREA
// ────────────────────────────────────────────────────────────────

const seoulMetro: MetroSystemData = {
  citySlug: 'seoul',
  cc: 'KR',
  name: 'Seoul Metropolitan Subway',
  status: 'operational',
  totalKm: 331.5,
  totalStations: 324,
  yearOpened: 1974,
  dailyRidership: 7_300_000,
  lines: [
    { name: 'Line 1', color: '#263C96', stations: 32, km: 52.2, yearOpened: 1974 },
    { name: 'Line 2', color: '#009D4A', stations: 51, km: 60.2, yearOpened: 1984 },
    { name: 'Line 3', color: '#EF7C1C', stations: 34, km: 35.2, yearOpened: 1985 },
    { name: 'Line 4', color: '#00A5DE', stations: 26, km: 40.5, yearOpened: 1985 },
    { name: 'Line 5', color: '#996CAC', stations: 51, km: 51.4, yearOpened: 1990 },
    { name: 'Line 6', color: '#CD7C2F', stations: 38, km: 35.1, yearOpened: 2000 },
    { name: 'Line 7', color: '#616D29', stations: 42, km: 42.1, yearOpened: 1996 },
    { name: 'Line 8', color: '#E6186C', stations: 17, km: 16.0, yearOpened: 1999 },
    { name: 'Line 9', color: '#BDB092', stations: 25, km: 27.0, yearOpened: 2009 },
  ],
  stations: [
    { slug: 'seoul-station', name: 'Seoul Station', nameKa: 'seoul-station', lat: 37.5547, lng: 126.9707, line: 'Line 1 / AREX', citySlug: 'seoul', cc: 'KR', yearOpened: 1974, interchange: true },
    { slug: 'gangnam', name: 'Gangnam', nameKa: 'gangnam', lat: 37.4981, lng: 127.0276, line: 'Line 2 / Shinbundang', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: true },
    { slug: 'jamsil', name: 'Jamsil', nameKa: 'jamsil', lat: 37.5133, lng: 127.1002, line: 'Line 2 / 8', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: true },
    { slug: 'samseong', name: 'Samseong', nameKa: 'samseong', lat: 37.4892, lng: 127.0623, line: 'Line 2', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: false },
    { slug: 'myeongdong', name: 'Myeongdong', nameKa: 'myeongdong', lat: 37.5609, lng: 126.9860, line: 'Line 4', citySlug: 'seoul', cc: 'KR', yearOpened: 1985, interchange: false },
    { slug: 'hongdae-ipgu', name: 'Hongik University', nameKa: 'hongik-university', lat: 37.5571, lng: 126.9244, line: 'Line 2 / AREX / Gyeongui', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: true },
    { slug: 'express-bus-terminal', name: 'Express Bus Terminal', nameKa: 'express-bus-terminal', lat: 37.5045, lng: 127.0047, line: 'Line 3 / 7 / 9', citySlug: 'seoul', cc: 'KR', yearOpened: 1985, interchange: true },
    { slug: 'sindorim', name: 'Sindorim', nameKa: 'sindorim', lat: 37.5150, lng: 126.9075, line: 'Line 1 / 2', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: true },
    { slug: 'city-hall-seoul', name: 'City Hall', nameKa: 'city-hall', lat: 37.5643, lng: 126.9770, line: 'Line 1 / 2', citySlug: 'seoul', cc: 'KR', yearOpened: 1974, interchange: true },
    { slug: 'euljiro-3-ga', name: 'Euljiro 3-ga', nameKa: 'euljiro-3-ga', lat: 37.5660, lng: 126.9825, line: 'Line 2 / 3', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: true },
    { slug: 'gongdeok', name: 'Gongdeok', nameKa: 'gongdeok', lat: 37.5388, lng: 126.9454, line: 'Line 5 / 6 / AREX / Gyeongui', citySlug: 'seoul', cc: 'KR', yearOpened: 1996, interchange: true },
    { slug: 'sadang', name: 'Sadang', nameKa: 'sadang', lat: 37.4867, lng: 126.9823, line: 'Line 2 / 4', citySlug: 'seoul', cc: 'KR', yearOpened: 1984, interchange: true },
    { slug: 'noryangjin', name: 'Noryangjin', nameKa: 'noryangjin', lat: 37.5153, lng: 126.9410, line: 'Line 1 / 9', citySlug: 'seoul', cc: 'KR', yearOpened: 1974, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — CHINA
// ────────────────────────────────────────────────────────────────

const beijingMetro: MetroSystemData = {
  citySlug: 'beijing',
  cc: 'CN',
  name: 'Beijing Subway',
  status: 'operational',
  totalKm: 807.0,
  totalStations: 475,
  yearOpened: 1969,
  dailyRidership: 10_500_000,
  lines: [
    { name: 'Line 1', color: '#C23A30', stations: 23, km: 31.0, yearOpened: 1969 },
    { name: 'Line 2', color: '#0060A9', stations: 18, km: 23.1, yearOpened: 1984 },
    { name: 'Line 4', color: '#008E9C', stations: 24, km: 28.2, yearOpened: 2009 },
    { name: 'Line 5', color: '#A6217E', stations: 23, km: 27.6, yearOpened: 2007 },
    { name: 'Line 6', color: '#D29E14', stations: 34, km: 38.0, yearOpened: 2012 },
    { name: 'Line 7', color: '#E26A40', stations: 30, km: 23.8, yearOpened: 2014 },
    { name: 'Line 8', color: '#009B77', stations: 25, km: 26.6, yearOpened: 2008 },
    { name: 'Line 9', color: '#9B26B6', stations: 13, km: 16.5, yearOpened: 2011 },
    { name: 'Line 10', color: '#009BC0', stations: 45, km: 57.1, yearOpened: 2008 },
    { name: 'Line 13', color: '#F9E153', stations: 16, km: 31.8, yearOpened: 2002 },
    { name: 'Line 14', color: '#D8A0C5', stations: 37, km: 47.4, yearOpened: 2013 },
  ],
  stations: [
    { slug: 'wangfujing', name: 'Wangfujing', nameKa: 'wangfujing', lat: 39.9139, lng: 116.4103, line: 'Line 1', citySlug: 'beijing', cc: 'CN', yearOpened: 1999, interchange: false },
    { slug: 'tiananmen-east', name: 'Tiananmen East', nameKa: 'tiananmen-east', lat: 39.9076, lng: 116.3974, line: 'Line 1', citySlug: 'beijing', cc: 'CN', yearOpened: 1969, interchange: false },
    { slug: 'xidan', name: 'Xidan', nameKa: 'xidan', lat: 39.9117, lng: 116.3732, line: 'Line 1 / 4', citySlug: 'beijing', cc: 'CN', yearOpened: 1969, interchange: true },
    { slug: 'dongzhimen', name: 'Dongzhimen', nameKa: 'dongzhimen', lat: 39.9424, lng: 116.4166, line: 'Line 2 / 13 / Airport Express', citySlug: 'beijing', cc: 'CN', yearOpened: 1984, interchange: true },
    { slug: 'beijing-station', name: 'Beijing Station', nameKa: 'beijing-station', lat: 39.9050, lng: 116.4270, line: 'Line 1 / 2', citySlug: 'beijing', cc: 'CN', yearOpened: 1969, interchange: true },
    { slug: 'xizhimen', name: 'Xizhimen', nameKa: 'xizhimen', lat: 39.9409, lng: 116.3536, line: 'Line 2 / 4 / 13', citySlug: 'beijing', cc: 'CN', yearOpened: 1984, interchange: true },
    { slug: 'guomao', name: 'Guomao', nameKa: 'guomao', lat: 39.9085, lng: 116.4608, line: 'Line 1 / 10', citySlug: 'beijing', cc: 'CN', yearOpened: 1999, interchange: true },
    { slug: 'zhongguancun', name: 'Zhongguancun', nameKa: 'zhongguancun', lat: 39.9811, lng: 116.3124, line: 'Line 4', citySlug: 'beijing', cc: 'CN', yearOpened: 2009, interchange: false },
    { slug: 'olympic-green', name: 'Olympic Green', nameKa: 'olympic-green', lat: 39.9930, lng: 116.3915, line: 'Line 8', citySlug: 'beijing', cc: 'CN', yearOpened: 2008, interchange: false },
    { slug: 'sanlitun', name: 'Sanlitun', nameKa: 'sanlitun', lat: 39.9353, lng: 116.4540, line: 'Line 10', citySlug: 'beijing', cc: 'CN', yearOpened: 2008, interchange: false },
    { slug: 'wangjing', name: 'Wangjing', nameKa: 'wangjing', lat: 39.9886, lng: 116.4722, line: 'Line 14 / 15', citySlug: 'beijing', cc: 'CN', yearOpened: 2010, interchange: true },
  ],
}

const shanghaiMetro: MetroSystemData = {
  citySlug: 'shanghai',
  cc: 'CN',
  name: 'Shanghai Metro',
  status: 'operational',
  totalKm: 831.0,
  totalStations: 508,
  yearOpened: 1993,
  dailyRidership: 10_600_000,
  lines: [
    { name: 'Line 1', color: '#E4002B', stations: 28, km: 36.5, yearOpened: 1993 },
    { name: 'Line 2', color: '#97D700', stations: 30, km: 64.0, yearOpened: 2000 },
    { name: 'Line 3', color: '#FFD100', stations: 29, km: 40.3, yearOpened: 2000 },
    { name: 'Line 4', color: '#5C2D91', stations: 26, km: 33.7, yearOpened: 2005 },
    { name: 'Line 5', color: '#944993', stations: 19, km: 17.2, yearOpened: 2007 },
    { name: 'Line 6', color: '#D3145D', stations: 28, km: 32.3, yearOpened: 2007 },
    { name: 'Line 7', color: '#FF6900', stations: 33, km: 44.3, yearOpened: 2009 },
    { name: 'Line 8', color: '#007EC2', stations: 30, km: 37.2, yearOpened: 2007 },
    { name: 'Line 9', color: '#71C5E8', stations: 35, km: 65.0, yearOpened: 2007 },
    { name: 'Line 10', color: '#C1A54C', stations: 31, km: 36.0, yearOpened: 2010 },
    { name: 'Line 11', color: '#87338A', stations: 38, km: 82.3, yearOpened: 2009 },
    { name: 'Line 12', color: '#00797D', stations: 32, km: 40.4, yearOpened: 2013 },
    { name: 'Line 13', color: '#E9CC59', stations: 35, km: 39.1, yearOpened: 2012 },
    { name: 'Line 14', color: '#5B2C84', stations: 37, km: 38.9, yearOpened: 2014 },
    { name: 'Line 15', color: '#C3A955', stations: 14, km: 22.2, yearOpened: 2021 },
    { name: 'Line 16', color: '#C8A7CE', stations: 13, km: 24.2, yearOpened: 2013 },
  ],
  stations: [
    { slug: 'peoples-square', name: 'Peoples Square', nameKa: 'peoples-square', lat: 31.2304, lng: 121.4737, line: 'Line 1 / 2 / 8', citySlug: 'shanghai', cc: 'CN', yearOpened: 1999, interchange: true },
    { slug: 'lujiazui', name: 'Lujiazui', nameKa: 'lujiazui', lat: 31.2397, lng: 121.5015, line: 'Line 2', citySlug: 'shanghai', cc: 'CN', yearOpened: 2000, interchange: false },
    { slug: 'jingan-temple', name: 'Jingan Temple', nameKa: 'jingan-temple', lat: 31.2230, lng: 121.4474, line: 'Line 2 / 7', citySlug: 'shanghai', cc: 'CN', yearOpened: 2000, interchange: true },
    { slug: 'hongqiao', name: 'Hongqiao', nameKa: 'hongqiao', lat: 31.1942, lng: 121.3310, line: 'Line 2 / 10', citySlug: 'shanghai', cc: 'CN', yearOpened: 2010, interchange: true },
    { slug: 'shanghai-railway', name: 'Shanghai Railway Station', nameKa: 'shanghai-railway', lat: 31.2504, lng: 121.4570, line: 'Line 1 / 3 / 4', citySlug: 'shanghai', cc: 'CN', yearOpened: 1995, interchange: true },
    { slug: 'xujiahui', name: 'Xujiahui', nameKa: 'xujiahui', lat: 31.1886, lng: 121.4422, line: 'Line 1 / 9 / 11', citySlug: 'shanghai', cc: 'CN', yearOpened: 1996, interchange: true },
    { slug: 'pudong-airport', name: 'Pudong Airport', nameKa: 'pudong-airport', lat: 31.1434, lng: 121.8052, line: 'Maglev / 2', citySlug: 'shanghai', cc: 'CN', yearOpened: 2004, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — HONG KONG
// ────────────────────────────────────────────────────────────────

const hongKongMTR: MetroSystemData = {
  citySlug: 'hong-kong',
  cc: 'HK',
  name: 'MTR',
  status: 'operational',
  totalKm: 271.0,
  totalStations: 99,
  yearOpened: 1979,
  dailyRidership: 4_700_000,
  lines: [
    { name: 'Island Line', color: '#0060A9', stations: 14, km: 16.3, yearOpened: 1985 },
    { name: 'Tsuen Wan Line', color: '#E3242B', stations: 16, km: 16.0, yearOpened: 1982 },
    { name: 'Kwun Tong Line', color: '#00A758', stations: 15, km: 15.8, yearOpened: 1979 },
    { name: 'Tung Chung Line', color: '#F5A623', stations: 9, km: 31.4, yearOpened: 1998 },
    { name: 'Tseung Kwan O Line', color: '#7B4DB5', stations: 8, km: 12.3, yearOpened: 2002 },
    { name: 'West Rail Line', color: '#A42085', stations: 12, km: 36.7, yearOpened: 2003 },
    { name: 'East Rail Line', color: '#6EC4E8', stations: 14, km: 45.8, yearOpened: 1910 },
    { name: 'Ma On Shan Line', color: '#009688', stations: 9, km: 11.4, yearOpened: 2004 },
    { name: 'South Island Line', color: '#005F75', stations: 5, km: 7.8, yearOpened: 2016 },
  ],
  stations: [
    { slug: 'admiralty', name: 'Admiralty', nameKa: 'admiralty', lat: 22.2793, lng: 114.1632, line: 'Island / Tsuen Wan / South Island', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1980, interchange: true },
    { slug: 'central-hk', name: 'Central', nameKa: 'central', lat: 22.2819, lng: 114.1583, line: 'Island / Tung Chung', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1979, interchange: true },
    { slug: 'tsim-sha-tsui', name: 'Tsim Sha Tsui', nameKa: 'tsim-sha-tsui', lat: 22.2988, lng: 114.1722, line: 'Tsuen Wan', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1979, interchange: false },
    { slug: 'kowloon-tong', name: 'Kowloon Tong', nameKa: 'kowloon-tong', lat: 22.3372, lng: 114.1765, line: 'Kwun Tong / East Rail', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1979, interchange: true },
    { slug: 'hung-hom', name: 'Hung Hom', nameKa: 'hung-hom', lat: 22.3048, lng: 114.1852, line: 'East Rail / West Rail / Tung Chung', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1975, interchange: true },
    { slug: 'tung-chung', name: 'Tung Chung', nameKa: 'tung-chung', lat: 22.2890, lng: 113.9418, line: 'Tung Chung', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1998, interchange: false },
    { slug: 'tsuen-wan', name: 'Tsuen Wan', nameKa: 'tsuen-wan', lat: 22.3708, lng: 114.1140, line: 'Tsuen Wan', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1982, interchange: false },
    { slug: 'north-point', name: 'North Point', nameKa: 'north-point', lat: 22.2911, lng: 114.2005, line: 'Island / Tseung Kwan O', citySlug: 'hong-kong', cc: 'HK', yearOpened: 1985, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — SINGAPORE
// ────────────────────────────────────────────────────────────────

const singaporeMRT: MetroSystemData = {
  citySlug: 'singapore',
  cc: 'SG',
  name: 'Singapore MRT / LRT',
  status: 'operational',
  totalKm: 200.0,
  totalStations: 131,
  yearOpened: 1987,
  dailyRidership: 3_400_000,
  lines: [
    { name: 'North South Line', color: '#EE3524', stations: 27, km: 45.0, yearOpened: 1987 },
    { name: 'East West Line', color: '#009645', stations: 32, km: 56.0, yearOpened: 1987 },
    { name: 'North East Line', color: '#9900AA', stations: 17, km: 20.0, yearOpened: 2003 },
    { name: 'Circle Line', color: '#FA9E0D', stations: 33, km: 35.7, yearOpened: 2009 },
    { name: 'Downtown Line', color: '#005EC4', stations: 34, km: 42.0, yearOpened: 2013 },
    { name: 'Thomson-East Coast Line', color: '#0099AA', stations: 30, km: 43.0, yearOpened: 2020 },
  ],
  stations: [
    { slug: 'raffles-place', name: 'Raffles Place', nameKa: 'raffles-place', lat: 1.2834, lng: 103.8513, line: 'North South / East West', citySlug: 'singapore', cc: 'SG', yearOpened: 1987, interchange: true },
    { slug: 'city-hall-sg', name: 'City Hall', nameKa: 'city-hall', lat: 1.2929, lng: 103.8545, line: 'North South / East West', citySlug: 'singapore', cc: 'SG', yearOpened: 1987, interchange: true },
    { slug: 'orchard', name: 'Orchard', nameKa: 'orchard', lat: 1.3047, lng: 103.8318, line: 'North South', citySlug: 'singapore', cc: 'SG', yearOpened: 1987, interchange: false },
    { slug: 'bugis', name: 'Bugis', nameKa: 'bugis', lat: 1.2992, lng: 103.8553, line: 'East West / Downtown', citySlug: 'singapore', cc: 'SG', yearOpened: 1987, interchange: true },
    { slug: 'jurong-east', name: 'Jurong East', nameKa: 'jurong-east', lat: 1.3329, lng: 103.7421, line: 'North South / East West', citySlug: 'singapore', cc: 'SG', yearOpened: 1988, interchange: true },
    { slug: 'serangoon', name: 'Serangoon', nameKa: 'serangoon', lat: 1.3500, lng: 103.8710, line: 'North East / Circle', citySlug: 'singapore', cc: 'SG', yearOpened: 2003, interchange: true },
    { slug: 'dhoby-ghaut', name: 'Dhoby Ghaut', nameKa: 'dhoby-ghaut', lat: 1.3003, lng: 103.8454, line: 'North South / North East / Circle', citySlug: 'singapore', cc: 'SG', yearOpened: 1987, interchange: true },
    { slug: 'marina-bay', name: 'Marina Bay', nameKa: 'marina-bay', lat: 1.2764, lng: 103.8543, line: 'North South / Circle / Thomson-East Coast', citySlug: 'singapore', cc: 'SG', yearOpened: 2007, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — TAIWAN / MALAYSIA / THAILAND
// ────────────────────────────────────────────────────────────────

const taipeiMRT: MetroSystemData = {
  citySlug: 'taipei',
  cc: 'TW',
  name: 'Taipei Metro (MRT)',
  status: 'operational',
  totalKm: 137.0,
  totalStations: 117,
  yearOpened: 1996,
  dailyRidership: 2_200_000,
  lines: [
    { name: 'Red Line (Tamsui-Xinyi)', color: '#E3002C', stations: 28, km: 32.8, yearOpened: 1997 },
    { name: 'Blue Line (Bannan)', color: '#0070BD', stations: 23, km: 25.7, yearOpened: 1999 },
    { name: 'Green Line (Songshan-Xindian)', color: '#00A651', stations: 22, km: 29.5, yearOpened: 1999 },
    { name: 'Orange Line (Zhonghe-Xinlu)', color: '#F8B61C', stations: 14, km: 17.7, yearOpened: 2012 },
    { name: 'Brown Line (Wenhu)', color: '#C48C31', stations: 24, km: 25.3, yearOpened: 1996 },
  ],
  stations: [
    { slug: 'taipei-main-station', name: 'Taipei Main Station', nameKa: 'taipei-main-station', lat: 25.0478, lng: 121.5170, line: 'Red / Blue', citySlug: 'taipei', cc: 'TW', yearOpened: 1997, interchange: true },
    { slug: 'zhongxiao-fuxing', name: 'Zhongxiao Fuxing', nameKa: 'zhongxiao-fuxing', lat: 25.0416, lng: 121.5439, line: 'Blue / Brown', citySlug: 'taipei', cc: 'TW', yearOpened: 1999, interchange: true },
    { slug: 'chiang-kai-shek', name: 'Chiang Kai-shek Memorial Hall', nameKa: 'chiang-kai-shek', lat: 25.0349, lng: 121.5183, line: 'Red / Green', citySlug: 'taipei', cc: 'TW', yearOpened: 1997, interchange: true },
    { slug: 'taipei-101', name: 'Taipei 101/World Trade Center', nameKa: 'taipei-101', lat: 25.0331, lng: 121.5645, line: 'Red', citySlug: 'taipei', cc: 'TW', yearOpened: 1997, interchange: false },
    { slug: 'ximen', name: 'Ximen', nameKa: 'ximen', lat: 25.0423, lng: 121.5083, line: 'Blue / Green', citySlug: 'taipei', cc: 'TW', yearOpened: 1999, interchange: true },
    { slug: 'nangang', name: 'Nangang', nameKa: 'nangang', lat: 25.0550, lng: 121.6071, line: 'Blue / Brown', citySlug: 'taipei', cc: 'TW', yearOpened: 1999, interchange: true },
  ],
}

const kualaLumpurMRT: MetroSystemData = {
  citySlug: 'kuala-lumpur',
  cc: 'MY',
  name: 'Kuala Lumpur Metro',
  status: 'operational',
  totalKm: 130.0,
  totalStations: 124,
  yearOpened: 1996,
  dailyRidership: 1_800_000,
  lines: [
    { name: 'KJL Kelana Jaya Line', color: '#E30613', stations: 37, km: 46.4, yearOpened: 1996 },
    { name: 'Sri Petaling Line', color: '#F78723', stations: 29, km: 33.5, yearOpened: 1996 },
    { name: 'Ampang Line', color: '#9B2335', stations: 18, km: 14.8, yearOpened: 1996 },
    { name: 'KL Monorail', color: '#833991', stations: 11, km: 8.6, yearOpened: 2003 },
    { name: 'MRT Kajang Line', color: '#005D47', stations: 22, km: 31.3, yearOpened: 2017 },
    { name: 'MRT Putrajaya Line', color: '#005D47', stations: 24, km: 38.5, yearOpened: 2023 },
  ],
  stations: [
    { slug: 'kl-sentral', name: 'KL Sentral', nameKa: 'kl-sentral', lat: 3.1340, lng: 101.6869, line: 'KJL / KLIA Ekspres', citySlug: 'kuala-lumpur', cc: 'MY', yearOpened: 1996, interchange: true },
    { slug: 'pasar-seni', name: 'Pasar Seni', nameKa: 'pasar-seni', lat: 3.1408, lng: 101.6981, line: 'KJL / MRT', citySlug: 'kuala-lumpur', cc: 'MY', yearOpened: 1996, interchange: true },
    { slug: 'masjid-jamek', name: 'Masjid Jamek', nameKa: 'masjid-jamek', lat: 3.1492, lng: 101.6966, line: 'KJL / Ampang', citySlug: 'kuala-lumpur', cc: 'MY', yearOpened: 1996, interchange: true },
    { slug: 'bukit-bintang', name: 'Bukit Bintang', nameKa: 'bukit-bintang', lat: 3.1465, lng: 101.7105, line: 'MRT / Monorail', citySlug: 'kuala-lumpur', cc: 'MY', yearOpened: 2017, interchange: true },
    { slug: 'kl-cc', name: 'KLCC', nameKa: 'klcc', lat: 3.1589, lng: 101.7130, line: 'KJL', citySlug: 'kuala-lumpur', cc: 'MY', yearOpened: 1996, interchange: false },
  ],
}

const bangkokMetro: MetroSystemData = {
  citySlug: 'bangkok',
  cc: 'TH',
  name: 'Bangkok BTS/MRT',
  status: 'operational',
  totalKm: 136.0,
  totalStations: 108,
  yearOpened: 1999,
  dailyRidership: 1_500_000,
  lines: [
    { name: 'BTS Sukhumvit Line', color: '#78BE20', stations: 34, km: 54.2, yearOpened: 1999 },
    { name: 'BTS Silom Line', color: '#0094A6', stations: 13, km: 14.8, yearOpened: 1999 },
    { name: 'BTS Gold Line', color: '#B5985A', stations: 4, km: 2.6, yearOpened: 2020 },
    { name: 'MRT Blue Line', color: '#1E3A8A', stations: 38, km: 41.0, yearOpened: 2004 },
    { name: 'MRT Purple Line', color: '#7B32A8', stations: 16, km: 23.0, yearOpened: 2016 },
    { name: 'MRT Yellow Line', color: '#FFE400', stations: 23, km: 30.4, yearOpened: 2023 },
    { name: 'MRT Pink Line', color: '#F58220', stations: 30, km: 34.5, yearOpened: 2023 },
    { name: 'Airport Rail Link', color: '#78BE20', stations: 8, km: 28.6, yearOpened: 2010 },
  ],
  stations: [
    { slug: 'siam', name: 'Siam', nameKa: 'siam', lat: 13.7455, lng: 100.5346, line: 'BTS Sukhumvit / Silom', citySlug: 'bangkok', cc: 'TH', yearOpened: 1999, interchange: true },
    { slug: 'chatuchak-park', name: 'Chatuchak Park', nameKa: 'chatuchak-park', lat: 13.7999, lng: 100.5510, line: 'BTS Sukhumvit / MRT Blue', citySlug: 'bangkok', cc: 'TH', yearOpened: 1999, interchange: true },
    { slug: 'asok', name: 'Asok', nameKa: 'asok', lat: 13.7367, lng: 100.5604, line: 'BTS Sukhumvit / MRT Blue', citySlug: 'bangkok', cc: 'TH', yearOpened: 1999, interchange: true },
    { slug: 'sala-daeng', name: 'Sala Daeng', nameKa: 'sala-daeng', lat: 13.7282, lng: 100.5344, line: 'BTS Silom / MRT Blue', citySlug: 'bangkok', cc: 'TH', yearOpened: 1999, interchange: true },
    { slug: 'phaya-thai', name: 'Phaya Thai', nameKa: 'phaya-thai', lat: 13.7569, lng: 100.5347, line: 'BTS / ARL', citySlug: 'bangkok', cc: 'TH', yearOpened: 2010, interchange: true },
    { slug: 'mo-chit', name: 'Mo Chit', nameKa: 'mo-chit', lat: 13.7979, lng: 100.5513, line: 'BTS Sukhumvit / MRT Blue', citySlug: 'bangkok', cc: 'TH', yearOpened: 1999, interchange: true },
    { slug: 'bang-sue', name: 'Bang Sue', nameKa: 'bang-sue', lat: 13.8038, lng: 100.5280, line: 'MRT Blue', citySlug: 'bangkok', cc: 'TH', yearOpened: 2004, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — INDIA
// ────────────────────────────────────────────────────────────────

const delhiMetro: MetroSystemData = {
  citySlug: 'delhi',
  cc: 'IN',
  name: 'Delhi Metro (DMRC)',
  status: 'operational',
  totalKm: 391.0,
  totalStations: 288,
  yearOpened: 2002,
  dailyRidership: 5_100_000,
  lines: [
    { name: 'Red Line', color: '#E2231A', stations: 29, km: 32.8, yearOpened: 2002 },
    { name: 'Yellow Line', color: '#FFCC00', stations: 37, km: 49.4, yearOpened: 2004 },
    { name: 'Blue Line', color: '#0072BA', stations: 44, km: 65.1, yearOpened: 2005 },
    { name: 'Green Line', color: '#009846', stations: 17, km: 18.9, yearOpened: 2010 },
    { name: 'Violet Line', color: '#813389', stations: 32, km: 47.8, yearOpened: 2010 },
    { name: 'Pink Line', color: '#F58498', stations: 38, km: 58.0, yearOpened: 2018 },
    { name: 'Magenta Line', color: '#E30613', stations: 25, km: 39.3, yearOpened: 2018 },
    { name: 'Orange Line (Airport)', color: '#E57822', stations: 6, km: 22.8, yearOpened: 2011 },
  ],
  stations: [
    { slug: 'rajiv-chowk', name: 'Rajiv Chowk', nameKa: 'rajiv-chowk', lat: 28.6329, lng: 77.2196, line: 'Yellow / Blue', citySlug: 'delhi', cc: 'IN', yearOpened: 2005, interchange: true },
    { slug: 'kashmere-gate', name: 'Kashmere Gate', nameKa: 'kashmere-gate', lat: 28.6677, lng: 77.2284, line: 'Red / Yellow / Violet', citySlug: 'delhi', cc: 'IN', yearOpened: 2002, interchange: true },
    { slug: 'central-secretariat', name: 'Central Secretariat', nameKa: 'central-secretariat', lat: 28.6159, lng: 77.2127, line: 'Yellow / Violet', citySlug: 'delhi', cc: 'IN', yearOpened: 2005, interchange: true },
    { slug: 'new-delhi', name: 'New Delhi', nameKa: 'new-delhi', lat: 28.6422, lng: 77.2288, line: 'Yellow / Airport Express', citySlug: 'delhi', cc: 'IN', yearOpened: 2005, interchange: true },
    { slug: 'mandi-house', name: 'Mandi House', nameKa: 'mandi-house', lat: 28.6254, lng: 77.2348, line: 'Blue / Violet', citySlug: 'delhi', cc: 'IN', yearOpened: 2005, interchange: true },
    { slug: 'dwarka', name: 'Dwarka Sector 21', nameKa: 'dwarka', lat: 28.5535, lng: 77.0594, line: 'Blue / Airport', citySlug: 'delhi', cc: 'IN', yearOpened: 2005, interchange: true },
    { slug: 'botanical-garden', name: 'Botanical Garden', nameKa: 'botanical-garden', lat: 28.5430, lng: 77.3341, line: 'Blue / Magenta', citySlug: 'delhi', cc: 'IN', yearOpened: 2009, interchange: true },
  ],
}

const mumbaiMetro: MetroSystemData = {
  citySlug: 'mumbai',
  cc: 'IN',
  name: 'Mumbai Metro',
  status: 'operational',
  totalKm: 33.0,
  totalStations: 28,
  yearOpened: 2014,
  dailyRidership: 800_000,
  lines: [
    { name: 'Line 1 (Versova-Andheri-Ghatkopar)', color: '#69B1E1', stations: 12, km: 11.4, yearOpened: 2014 },
    { name: 'Line 2A (Dahisar-DN Nagar)', color: '#FF6913', stations: 17, km: 18.6, yearOpened: 2022 },
    { name: 'Line 7 (Andheri East-Mundhwa)', color: '#F58220', stations: 13, km: 16.5, yearOpened: 2023 },
  ],
  stations: [
    { slug: 'andheri', name: 'Andheri', nameKa: 'andheri', lat: 19.1197, lng: 72.8464, line: 'Line 1', citySlug: 'mumbai', cc: 'IN', yearOpened: 2014, interchange: true },
    { slug: 'ghatkopar', name: 'Ghatkopar', nameKa: 'ghatkopar', lat: 19.0863, lng: 72.9083, line: 'Line 1', citySlug: 'mumbai', cc: 'IN', yearOpened: 2014, interchange: true },
    { slug: 'versova', name: 'Versova', nameKa: 'versova', lat: 19.1283, lng: 72.8189, line: 'Line 1', citySlug: 'mumbai', cc: 'IN', yearOpened: 2014, interchange: false },
  ],
}

const chennaiMetro: MetroSystemData = {
  citySlug: 'chennai',
  cc: 'IN',
  name: 'Chennai Metro',
  status: 'operational',
  totalKm: 54.0,
  totalStations: 42,
  yearOpened: 2015,
  dailyRidership: 300_000,
  lines: [
    { name: 'Blue Line (Wimco Nagar-Airport)', color: '#0066B3', stations: 26, km: 23.0, yearOpened: 2015 },
    { name: 'Green Line (Chennai Central-St Thomas Mount)', color: '#00843D', stations: 17, km: 22.0, yearOpened: 2017 },
  ],
  stations: [
    { slug: 'chennai-central', name: 'Chennai Central', nameKa: 'chennai-central', lat: 13.0827, lng: 80.2707, line: 'Green / Blue', citySlug: 'chennai', cc: 'IN', yearOpened: 2015, interchange: true },
    { slug: 'airport-chennai', name: 'Chennai Airport', nameKa: 'chennai-airport', lat: 12.9941, lng: 80.1709, line: 'Blue', citySlug: 'chennai', cc: 'IN', yearOpened: 2015, interchange: false },
  ],
}

const kolkataMetro: MetroSystemData = {
  citySlug: 'kolkata',
  cc: 'IN',
  name: 'Kolkata Metro',
  status: 'operational',
  totalKm: 39.0,
  totalStations: 32,
  yearOpened: 1984,
  dailyRidership: 700_000,
  lines: [
    { name: 'Line 1 (North-South)', color: '#008C95', stations: 26, km: 31.0, yearOpened: 1984 },
    { name: 'Line 2 (East-West)', color: '#6DAF4E', stations: 6, km: 8.0, yearOpened: 2021 },
  ],
  stations: [
    { slug: 'dum-dum', name: 'Dum Dum', nameKa: 'dum-dum', lat: 22.6203, lng: 88.4180, line: 'Line 1', citySlug: 'kolkata', cc: 'IN', yearOpened: 1984, interchange: true },
    { slug: 'esplanade', name: 'Esplanade', nameKa: 'esplanade', lat: 22.5584, lng: 88.3510, line: 'Line 1 / 2', citySlug: 'kolkata', cc: 'IN', yearOpened: 1984, interchange: true },
  ],
}

const bangaloreMetro: MetroSystemData = {
  citySlug: 'bangalore',
  cc: 'IN',
  name: 'Namma Metro (Bangalore)',
  status: 'operational',
  totalKm: 69.5,
  totalStations: 57,
  yearOpened: 2011,
  dailyRidership: 550_000,
  lines: [
    { name: 'Purple Line', color: '#91278E', stations: 31, km: 38.0, yearOpened: 2011 },
    { name: 'Green Line', color: '#339D45', stations: 26, km: 31.5, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'majestic', name: 'Majestic (Kempegowda)', nameKa: 'majestic', lat: 12.9767, lng: 77.5753, line: 'Purple / Green', citySlug: 'bangalore', cc: 'IN', yearOpened: 2011, interchange: true },
    { slug: 'mg-road-blr', name: 'MG Road', nameKa: 'mg-road', lat: 12.9756, lng: 77.6044, line: 'Purple', citySlug: 'bangalore', cc: 'IN', yearOpened: 2011, interchange: false },
  ],
}

const hyderabadMetro: MetroSystemData = {
  citySlug: 'hyderabad',
  cc: 'IN',
  name: 'Hyderabad Metro',
  status: 'operational',
  totalKm: 69.2,
  totalStations: 57,
  yearOpened: 2017,
  dailyRidership: 430_000,
  lines: [
    { name: 'Red Line (Miyapur-LB Nagar)', color: '#E2231A', stations: 27, km: 27.5, yearOpened: 2017 },
    { name: 'Blue Line (JBS-Falaknuma)', color: '#0072BA', stations: 17, km: 17.5, yearOpened: 2020 },
    { name: 'Green Line (MGBS-Congress)', color: '#009846', stations: 9, km: 11.5, yearOpened: 2023 },
  ],
  stations: [
    { slug: 'ameerpet', name: 'Ameerpet', nameKa: 'ameerpet', lat: 17.4326, lng: 78.4072, line: 'Red / Blue', citySlug: 'hyderabad', cc: 'IN', yearOpened: 2017, interchange: true },
    { slug: 'mgbs', name: 'MGBS', nameKa: 'mgbs', lat: 17.3690, lng: 78.4765, line: 'Red / Green', citySlug: 'hyderabad', cc: 'IN', yearOpened: 2017, interchange: true },
  ],
}

const puneMetro: MetroSystemData = {
  citySlug: 'pune',
  cc: 'IN',
  name: 'Pune Metro',
  status: 'operational',
  totalKm: 33.2,
  totalStations: 28,
  yearOpened: 2022,
  dailyRidership: 120_000,
  lines: [
    { name: 'Line 1 (Purple)', color: '#91278E', stations: 14, km: 16.6, yearOpened: 2022 },
    { name: 'Line 2 (Aqua)', color: '#0099CC', stations: 14, km: 16.6, yearOpened: 2024 },
  ],
  stations: [
    { slug: 'pune-railway', name: 'Pune Railway Station', nameKa: 'pune-railway', lat: 18.5286, lng: 73.8746, line: 'Line 1 / Line 2', citySlug: 'pune', cc: 'IN', yearOpened: 2022, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — MORE CHINESE CITIES
// ────────────────────────────────────────────────────────────────

const guangzhouMetro: MetroSystemData = {
  citySlug: 'guangzhou',
  cc: 'CN',
  name: 'Guangzhou Metro',
  status: 'operational',
  totalKm: 621.0,
  totalStations: 302,
  yearOpened: 1997,
  dailyRidership: 8_800_000,
  lines: [
    { name: 'Line 1', color: '#F5D122', stations: 16, km: 18.5, yearOpened: 1997 },
    { name: 'Line 2', color: '#E8502D', stations: 24, km: 31.8, yearOpened: 2002 },
    { name: 'Line 3', color: '#F76A23', stations: 29, km: 67.6, yearOpened: 2005 },
    { name: 'Line 4', color: '#006098', stations: 23, km: 43.6, yearOpened: 2005 },
    { name: 'Line 5', color: '#00B5E2', stations: 24, km: 31.9, yearOpened: 2009 },
    { name: 'Line 6', color: '#84429D', stations: 32, km: 42.1, yearOpened: 2013 },
    { name: 'Line 7', color: '#C4A747', stations: 24, km: 32.1, yearOpened: 2016 },
    { name: 'Line 8', color: '#98D4A3', stations: 13, km: 14.9, yearOpened: 2010 },
  ],
  stations: [
    { slug: 'tianhe', name: 'Tianhe Station', nameKa: 'tianhe', lat: 23.1381, lng: 113.3290, line: 'Line 1 / 3', citySlug: 'guangzhou', cc: 'CN', yearOpened: 1997, interchange: true },
    { slug: 'guangzhou-railway', name: 'Guangzhou Railway Station', nameKa: 'guangzhou-railway', lat: 23.1528, lng: 113.2585, line: 'Line 2 / 5', citySlug: 'guangzhou', cc: 'CN', yearOpened: 1997, interchange: true },
    { slug: 'zhujiang-xincheng', name: 'Zhujiang New Town', nameKa: 'zhujiang-new-town', lat: 23.1183, lng: 113.3250, line: 'Line 3 / 5', citySlug: 'guangzhou', cc: 'CN', yearOpened: 2005, interchange: true },
  ],
}

const shenzhenMetro: MetroSystemData = {
  citySlug: 'shenzhen',
  cc: 'CN',
  name: 'Shenzhen Metro',
  status: 'operational',
  totalKm: 558.0,
  totalStations: 312,
  yearOpened: 2004,
  dailyRidership: 7_600_000,
  lines: [
    { name: 'Line 1', color: '#006CBF', stations: 30, km: 40.9, yearOpened: 2004 },
    { name: 'Line 2', color: '#FF6913', stations: 32, km: 35.8, yearOpened: 2011 },
    { name: 'Line 3', color: '#78C257', stations: 30, km: 41.7, yearOpened: 2011 },
    { name: 'Line 4', color: '#F5D122', stations: 23, km: 20.5, yearOpened: 2011 },
    { name: 'Line 5', color: '#A4329B', stations: 23, km: 40.0, yearOpened: 2011 },
    { name: 'Line 7', color: '#007B5F', stations: 30, km: 32.4, yearOpened: 2016 },
    { name: 'Line 9', color: '#E99C53', stations: 22, km: 25.0, yearOpened: 2016 },
    { name: 'Line 10', color: '#F5D122', stations: 24, km: 26.4, yearOpened: 2020 },
    { name: 'Line 11', color: '#60368E', stations: 19, km: 51.9, yearOpened: 2022 },
  ],
  stations: [
    { slug: 'luohu', name: 'Luohu', nameKa: 'luohu', lat: 22.5553, lng: 114.1205, line: 'Line 1', citySlug: 'shenzhen', cc: 'CN', yearOpened: 2004, interchange: true },
    { slug: 'futian', name: 'Futian', nameKa: 'futian', lat: 22.5410, lng: 114.0507, line: 'Line 2 / 3', citySlug: 'shenzhen', cc: 'CN', yearOpened: 2011, interchange: true },
    { slug: 'shenzhen-north', name: 'Shenzhen North', nameKa: 'shenzhen-north', lat: 22.6098, lng: 114.0298, line: 'Line 4 / 5 / 6', citySlug: 'shenzhen', cc: 'CN', yearOpened: 2011, interchange: true },
  ],
}

const chengduMetro: MetroSystemData = {
  citySlug: 'chengdu',
  cc: 'CN',
  name: 'Chengdu Metro',
  status: 'operational',
  totalKm: 561.0,
  totalStations: 373,
  yearOpened: 2010,
  dailyRidership: 7_000_000,
  lines: [
    { name: 'Line 1', color: '#005FAA', stations: 35, km: 41.0, yearOpened: 2010 },
    { name: 'Line 2', color: '#009B4E', stations: 30, km: 42.0, yearOpened: 2013 },
    { name: 'Line 3', color: '#ED1C24', stations: 37, km: 49.8, yearOpened: 2015 },
    { name: 'Line 4', color: '#00A3E0', stations: 16, km: 22.5, yearOpened: 2017 },
    { name: 'Line 5', color: '#9B26B6', stations: 41, km: 49.0, yearOpened: 2019 },
    { name: 'Line 6', color: '#D29E14', stations: 38, km: 68.0, yearOpened: 2020 },
    { name: 'Line 7', color: '#00838F', stations: 25, km: 38.0, yearOpened: 2017 },
    { name: 'Line 8', color: '#E91E63', stations: 13, km: 22.0, yearOpened: 2020 },
    { name: 'Line 10', color: '#FF6913', stations: 17, km: 38.0, yearOpened: 2017 },
  ],
  stations: [
    { slug: 'tianfu-square', name: 'Tianfu Square', nameKa: 'tianfu-square', lat: 30.5729, lng: 104.0668, line: 'Line 1 / 2', citySlug: 'chengdu', cc: 'CN', yearOpened: 2010, interchange: true },
    { slug: 'chunxi-road', name: 'Chunxi Road', nameKa: 'chunxi-road', lat: 30.6571, lng: 104.0815, line: 'Line 2 / 3', citySlug: 'chengdu', cc: 'CN', yearOpened: 2013, interchange: true },
    { slug: 'chengdu-east', name: 'Chengdu East', nameKa: 'chengdu-east', lat: 30.6330, lng: 104.1533, line: 'Line 2', citySlug: 'chengdu', cc: 'CN', yearOpened: 2013, interchange: true },
    { slug: 'chengdu-south', name: 'Chengdu South', nameKa: 'chengdu-south', lat: 30.5060, lng: 104.0663, line: 'Line 1 / 7 / 18', citySlug: 'chengdu', cc: 'CN', yearOpened: 2010, interchange: true },
  ],
}

const wuhanMetro: MetroSystemData = {
  citySlug: 'wuhan',
  cc: 'CN',
  name: 'Wuhan Metro',
  status: 'operational',
  totalKm: 460.0,
  totalStations: 303,
  yearOpened: 2004,
  dailyRidership: 4_000_000,
  lines: [
    { name: 'Line 1', color: '#003DA5', stations: 32, km: 38.5, yearOpened: 2004 },
    { name: 'Line 2', color: '#C5003C', stations: 21, km: 27.7, yearOpened: 2012 },
    { name: 'Line 3', color: '#E57822', stations: 24, km: 33.2, yearOpened: 2015 },
    { name: 'Line 4', color: '#009944', stations: 28, km: 35.4, yearOpened: 2014 },
    { name: 'Line 6', color: '#6DC8BF', stations: 27, km: 35.9, yearOpened: 2016 },
    { name: 'Line 7', color: '#C69FD2', stations: 20, km: 31.3, yearOpened: 2018 },
  ],
  stations: [
    { slug: 'jiedaokou', name: 'Jiedaokou', nameKa: 'jiedaokou', lat: 30.5417, lng: 114.3606, line: 'Line 2 / 4', citySlug: 'wuhan', cc: 'CN', yearOpened: 2012, interchange: true },
    { slug: 'optics-valley', name: 'Optics Valley Square', nameKa: 'optics-valley', lat: 30.5034, lng: 114.3956, line: 'Line 2 / 11', citySlug: 'wuhan', cc: 'CN', yearOpened: 2012, interchange: true },
  ],
}

const hangzhouMetro: MetroSystemData = {
  citySlug: 'hangzhou',
  cc: 'CN',
  name: 'Hangzhou Metro',
  status: 'operational',
  totalKm: 516.0,
  totalStations: 278,
  yearOpened: 2012,
  dailyRidership: 4_500_000,
  lines: [
    { name: 'Line 1', color: '#C3002D', stations: 34, km: 48.0, yearOpened: 2012 },
    { name: 'Line 2', color: '#A3C943', stations: 33, km: 43.3, yearOpened: 2014 },
    { name: 'Line 3', color: '#FF9900', stations: 22, km: 26.3, yearOpened: 2022 },
    { name: 'Line 4', color: '#5C92FA', stations: 24, km: 46.8, yearOpened: 2022 },
    { name: 'Line 5', color: '#00A88E', stations: 40, km: 56.2, yearOpened: 2020 },
    { name: 'Line 6', color: '#999999', stations: 32, km: 51.2, yearOpened: 2020 },
  ],
  stations: [
    { slug: 'hangzhou-east', name: 'Hangzhou East', nameKa: 'hangzhou-east', lat: 30.2915, lng: 120.2053, line: 'Line 1 / 4 / 19', citySlug: 'hangzhou', cc: 'CN', yearOpened: 2014, interchange: true },
    { slug: 'wulin-square', name: 'Wulin Square', nameKa: 'wulin-square', lat: 30.2680, lng: 120.1680, line: 'Line 1 / 3', citySlug: 'hangzhou', cc: 'CN', yearOpened: 2012, interchange: true },
  ],
}

const nanjingMetro: MetroSystemData = {
  citySlug: 'nanjing',
  cc: 'CN',
  name: 'Nanjing Metro',
  status: 'operational',
  totalKm: 427.0,
  totalStations: 215,
  yearOpened: 2005,
  dailyRidership: 3_500_000,
  lines: [
    { name: 'Line 1', color: '#0099CC', stations: 27, km: 38.9, yearOpened: 2005 },
    { name: 'Line 2', color: '#FFD100', stations: 26, km: 43.3, yearOpened: 2010 },
    { name: 'Line 3', color: '#0068B5', stations: 29, km: 44.9, yearOpened: 2015 },
    { name: 'Line 4', color: '#49B649', stations: 18, km: 33.8, yearOpened: 2017 },
    { name: 'Line 10', color: '#009B77', stations: 14, km: 22.3, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'nanjing-station', name: 'Nanjing Station', nameKa: 'nanjing-station', lat: 32.0833, lng: 118.7953, line: 'Line 1 / 3', citySlug: 'nanjing', cc: 'CN', yearOpened: 2005, interchange: true },
    { slug: 'xintiandi', name: 'Xintiandi', nameKa: 'xintiandi', lat: 32.0399, lng: 118.7868, line: 'Line 1 / 3', citySlug: 'nanjing', cc: 'CN', yearOpened: 2005, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// ASIA — SOUTHEAST ASIA / CENTRAL ASIA / MIDDLE EAST
// ────────────────────────────────────────────────────────────────

const manilaMetro: MetroSystemData = {
  citySlug: 'manila',
  cc: 'PH',
  name: 'Manila MRT/LRT',
  status: 'operational',
  totalKm: 72.0,
  totalStations: 56,
  yearOpened: 1984,
  dailyRidership: 1_300_000,
  lines: [
    { name: 'LRT Line 1', color: '#80C040', stations: 20, km: 19.0, yearOpened: 1984 },
    { name: 'LRT Line 2', color: '#EE3694', stations: 11, km: 13.8, yearOpened: 2003 },
    { name: 'MRT Line 3', color: '#006DAE', stations: 13, km: 16.9, yearOpened: 1999 },
  ],
  stations: [
    { slug: 'cubao', name: 'Cubao', nameKa: 'cubao', lat: 14.6194, lng: 121.0504, line: 'LRT 2 / MRT 3', citySlug: 'manila', cc: 'PH', yearOpened: 2003, interchange: true },
    { slug: 'edsa', name: 'EDSA', nameKa: 'edsa', lat: 14.5794, lng: 121.0494, line: 'MRT 3 / LRT 1', citySlug: 'manila', cc: 'PH', yearOpened: 1999, interchange: true },
    { slug: 'doroteo-jose', name: 'Doroteo Jose', nameKa: 'doroteo-jose', lat: 14.6014, lng: 120.9836, line: 'LRT 1 / LRT 2', citySlug: 'manila', cc: 'PH', yearOpened: 1984, interchange: true },
  ],
}

const hanoiMetro: MetroSystemData = {
  citySlug: 'hanoi',
  cc: 'VN',
  name: 'Hanoi Metro',
  status: 'operational',
  totalKm: 21.0,
  totalStations: 14,
  yearOpened: 2021,
  dailyRidership: 50_000,
  lines: [
    { name: 'Line 2A (Cat Linh - Ha Dong)', color: '#009739', stations: 14, km: 13.1, yearOpened: 2021 },
    { name: 'Line 3 (Nhon - Hanoi Station)', color: '#E67E22', stations: 12, km: 12.0, yearOpened: 2024 },
  ],
  stations: [
    { slug: 'cat-linh', name: 'Cat Linh', nameKa: 'cat-linh', lat: 21.0279, lng: 105.8294, line: 'Line 2A', citySlug: 'hanoi', cc: 'VN', yearOpened: 2021, interchange: false },
    { slug: 'ha-dong', name: 'Ha Dong', nameKa: 'ha-dong', lat: 20.9520, lng: 105.7573, line: 'Line 2A', citySlug: 'hanoi', cc: 'VN', yearOpened: 2021, interchange: false },
  ],
}

const hoChiMinhCityMetro: MetroSystemData = {
  citySlug: 'ho-chi-minh-city',
  cc: 'VN',
  name: 'Ho Chi Minh City Metro',
  status: 'under-construction',
  totalKm: 19.7,
  totalStations: 14,
  yearOpened: 2024,
  dailyRidership: 100_000,
  lines: [
    { name: 'Line 1 (Ben Thanh - Suoi Tien)', color: '#E2231A', stations: 14, km: 19.7, yearOpened: 2024 },
  ],
  stations: [
    { slug: 'ben-thanh', name: 'Ben Thanh', nameKa: 'ben-thanh', lat: 10.7721, lng: 106.6980, line: 'Line 1', citySlug: 'ho-chi-minh-city', cc: 'VN', yearOpened: 2024, interchange: false },
  ],
}

const dhakaMetro: MetroSystemData = {
  citySlug: 'dhaka',
  cc: 'BD',
  name: 'Dhaka Metro Rail',
  status: 'operational',
  totalKm: 20.1,
  totalStations: 16,
  yearOpened: 2022,
  dailyRidership: 200_000,
  lines: [
    { name: 'Line 6 (Uttara - Motijheel)', color: '#0068B5', stations: 16, km: 20.1, yearOpened: 2022 },
  ],
  stations: [
    { slug: 'uttara', name: 'Uttara', nameKa: 'uttara', lat: 23.8759, lng: 90.3796, line: 'Line 6', citySlug: 'dhaka', cc: 'BD', yearOpened: 2022, interchange: false },
    { slug: 'motijheel', name: 'Motijheel', nameKa: 'motijheel', lat: 23.7337, lng: 90.4198, line: 'Line 6', citySlug: 'dhaka', cc: 'BD', yearOpened: 2022, interchange: false },
  ],
}

const karachiMetro: MetroSystemData = {
  citySlug: 'karachi',
  cc: 'PK',
  name: 'Karachi Green Line BRT',
  status: 'operational',
  totalKm: 24.0,
  totalStations: 12,
  yearOpened: 2015,
  dailyRidership: 150_000,
  lines: [
    { name: 'Green Line BRT', color: '#009846', stations: 12, km: 24.0, yearOpened: 2015 },
  ],
  stations: [
    { slug: 'nagan-chowrang', name: 'Nagan Chowrang', nameKa: 'nagan-chowrang', lat: 24.9204, lng: 67.0629, line: 'Green Line', citySlug: 'karachi', cc: 'PK', yearOpened: 2015, interchange: false },
  ],
}

const lahoreMetro: MetroSystemData = {
  citySlug: 'lahore',
  cc: 'PK',
  name: 'Lahore Metro',
  status: 'operational',
  totalKm: 27.1,
  totalStations: 26,
  yearOpened: 2020,
  dailyRidership: 200_000,
  lines: [
    { name: 'Orange Line', color: '#FF6913', stations: 26, km: 27.1, yearOpened: 2020 },
  ],
  stations: [
    { slug: 'dera-gujjran', name: 'Dera Gujran', nameKa: 'dera-gujjran', lat: 31.5825, lng: 74.3164, line: 'Orange Line', citySlug: 'lahore', cc: 'PK', yearOpened: 2020, interchange: false },
    { slug: 'ali-town', name: 'Ali Town', nameKa: 'ali-town', lat: 31.4754, lng: 74.2905, line: 'Orange Line', citySlug: 'lahore', cc: 'PK', yearOpened: 2020, interchange: false },
  ],
}

const almatyMetro: MetroSystemData = {
  citySlug: 'almaty',
  cc: 'KZ',
  name: 'Almaty Metro',
  status: 'operational',
  totalKm: 11.3,
  totalStations: 9,
  yearOpened: 2011,
  dailyRidership: 60_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 9, km: 11.3, yearOpened: 2011 },
  ],
  stations: [
    { slug: 'baiqonyr', name: 'Baiqonyr Railway Station', nameKa: 'baiqonyr', lat: 43.2380, lng: 76.9452, line: 'Line 1', citySlug: 'almaty', cc: 'KZ', yearOpened: 2011, interchange: true },
    { slug: 'abai', name: 'Abai', nameKa: 'abai', lat: 43.2433, lng: 76.9503, line: 'Line 1', citySlug: 'almaty', cc: 'KZ', yearOpened: 2011, interchange: false },
  ],
}

const tashkentMetro: MetroSystemData = {
  citySlug: 'tashkent',
  cc: 'UZ',
  name: 'Tashkent Metro',
  status: 'operational',
  totalKm: 36.2,
  totalStations: 29,
  yearOpened: 1977,
  dailyRidership: 200_000,
  lines: [
    { name: 'Chilonzor Line', color: '#E30613', stations: 13, km: 15.2, yearOpened: 1977 },
    { name: 'Ozbekiston Line', color: '#0068B5', stations: 8, km: 11.5, yearOpened: 1984 },
    { name: 'Yunus Abad Line', color: '#009846', stations: 8, km: 9.5, yearOpened: 1984 },
  ],
  stations: [
    { slug: 'kosmonavtlar', name: 'Kosmonavtlar', nameKa: 'kosmonavtlar', lat: 41.3165, lng: 69.2793, line: 'Chilonzor', citySlug: 'tashkent', cc: 'UZ', yearOpened: 1977, interchange: false },
    { slug: 'mustaqillik', name: 'Mustaqillik Maydoni', nameKa: 'mustaqillik', lat: 41.3131, lng: 69.2739, line: 'Ozbekiston / Yunus Abad', citySlug: 'tashkent', cc: 'UZ', yearOpened: 1984, interchange: true },
  ],
}

const dubaiMetro: MetroSystemData = {
  citySlug: 'dubai',
  cc: 'AE',
  name: 'Dubai Metro',
  status: 'operational',
  totalKm: 75.0,
  totalStations: 49,
  yearOpened: 2009,
  dailyRidership: 650_000,
  lines: [
    { name: 'Red Line', color: '#E2231A', stations: 28, km: 52.1, yearOpened: 2009 },
    { name: 'Green Line', color: '#009846', stations: 20, km: 23.0, yearOpened: 2011 },
  ],
  stations: [
    { slug: 'burjuman', name: 'BurJuman', nameKa: 'burjuman', lat: 25.2530, lng: 55.2998, line: 'Red / Green', citySlug: 'dubai', cc: 'AE', yearOpened: 2009, interchange: true },
    { slug: 'jebel-ali', name: 'Jebel Ali', nameKa: 'jebel-ali', lat: 25.0578, lng: 55.1191, line: 'Red', citySlug: 'dubai', cc: 'AE', yearOpened: 2009, interchange: false },
    { slug: 'mall-of-emirates', name: 'Mall of the Emirates', nameKa: 'mall-of-the-emirates', lat: 25.1176, lng: 55.1997, line: 'Red', citySlug: 'dubai', cc: 'AE', yearOpened: 2009, interchange: false },
    { slug: 'deira-city-centre', name: 'Deira City Centre', nameKa: 'deira-city-centre', lat: 25.2510, lng: 55.3260, line: 'Red', citySlug: 'dubai', cc: 'AE', yearOpened: 2009, interchange: false },
    { slug: 'union-dubai', name: 'Union', nameKa: 'union', lat: 25.2673, lng: 55.3103, line: 'Red / Green', citySlug: 'dubai', cc: 'AE', yearOpened: 2009, interchange: true },
    { slug: 'creek', name: 'Creek', nameKa: 'creek', lat: 25.2613, lng: 55.3329, line: 'Green', citySlug: 'dubai', cc: 'AE', yearOpened: 2011, interchange: false },
    { slug: 'dubai-airport', name: 'Dubai International Airport', nameKa: 'dubai-airport', lat: 25.2400, lng: 55.3540, line: 'Red', citySlug: 'dubai', cc: 'AE', yearOpened: 2009, interchange: false },
  ],
}

const dohaMetro: MetroSystemData = {
  citySlug: 'doha',
  cc: 'QA',
  name: 'Doha Metro',
  status: 'operational',
  totalKm: 40.0,
  totalStations: 18,
  yearOpened: 2019,
  dailyRidership: 150_000,
  lines: [
    { name: 'Red Line', color: '#E2231A', stations: 11, km: 23.0, yearOpened: 2019 },
    { name: 'Green Line', color: '#009846', stations: 7, km: 11.0, yearOpened: 2020 },
    { name: 'Gold Line', color: '#C9A84C', stations: 5, km: 6.0, yearOpened: 2020 },
  ],
  stations: [
    { slug: 'msheireb', name: 'Msheireb', nameKa: 'msheireb', lat: 25.2867, lng: 51.5200, line: 'Red / Green / Gold', citySlug: 'doha', cc: 'QA', yearOpened: 2019, interchange: true },
    { slug: 'west-bay', name: 'West Bay', nameKa: 'west-bay', lat: 25.3183, lng: 51.5204, line: 'Red', citySlug: 'doha', cc: 'QA', yearOpened: 2019, interchange: false },
    { slug: 'hamad-airport', name: 'Hamad International Airport', nameKa: 'hamad-airport', lat: 25.2731, lng: 51.6080, line: 'Red', citySlug: 'doha', cc: 'QA', yearOpened: 2019, interchange: false },
  ],
}

const riyadhMetro: MetroSystemData = {
  citySlug: 'riyadh',
  cc: 'SA',
  name: 'Riyadh Metro',
  status: 'under-construction',
  totalKm: 176.0,
  totalStations: 85,
  yearOpened: 2025,
  dailyRidership: 0,
  lines: [
    { name: 'Line 1 (Blue)', color: '#0072BA', stations: 22, km: 39.4, yearOpened: 2025 },
    { name: 'Line 2 (Orange)', color: '#FF6913', stations: 25, km: 25.3, yearOpened: 2025 },
    { name: 'Line 3 (Green)', color: '#009846', stations: 20, km: 45.3, yearOpened: 2025 },
    { name: 'Line 4 (Yellow)', color: '#FFD100', stations: 10, km: 29.6, yearOpened: 2025 },
    { name: 'Line 5 (Violet)', color: '#9B26B6', stations: 14, km: 34.6, yearOpened: 2025 },
    { name: 'Line 6 (Brown)', color: '#7B3F00', stations: 10, km: 12.4, yearOpened: 2025 },
  ],
  stations: [
    { slug: 'olaya-station', name: 'Olaya Station', nameKa: 'olaya-station', lat: 24.7120, lng: 46.6840, line: 'Blue / Orange / Green', citySlug: 'riyadh', cc: 'SA', yearOpened: 2025, interchange: true },
  ],
}

const istanbulMetro: MetroSystemData = {
  citySlug: 'istanbul',
  cc: 'TR',
  name: 'Istanbul Metro / Tram',
  status: 'operational',
  totalKm: 225.0,
  totalStations: 163,
  yearOpened: 1989,
  dailyRidership: 2_500_000,
  lines: [
    { name: 'M1A (Yenikapi-Ataturk Havalimani)', color: '#E30613', stations: 12, km: 12.9, yearOpened: 1989 },
    { name: 'M1B (Yenikapi-Kirazli)', color: '#E30613', stations: 15, km: 15.8, yearOpened: 1994 },
    { name: 'M2 (Yenikapi-Haciosman)', color: '#0068B5', stations: 11, km: 16.1, yearOpened: 2000 },
    { name: 'M3 (Kirazli-Olimpiyat Koyu)', color: '#00A3E0', stations: 11, km: 15.8, yearOpened: 2013 },
    { name: 'M4 (Kadikoy-Sabih Gokcen)', color: '#009944', stations: 23, km: 26.0, yearOpened: 2012 },
    { name: 'M5 (Uskudar-Cekmekoy)', color: '#8B008B', stations: 16, km: 20.4, yearOpened: 2017 },
    { name: 'M6 (Levent-Bogazici Universitesi)', color: '#C9A84C', stations: 4, km: 3.3, yearOpened: 2015 },
    { name: 'M7 (Mecidiyekoy-Mahmutbey)', color: '#FF6913', stations: 15, km: 20.0, yearOpened: 2020 },
    { name: 'T1 (Kabatas-Bagcilar)', color: '#00703C', stations: 31, km: 22.4, yearOpened: 1992 },
    { name: 'T4 (Topkapi-Mescid-i Selam)', color: '#E37121', stations: 22, km: 15.6, yearOpened: 2007 },
  ],
  stations: [
    { slug: 'yenikapi', name: 'Yenikapi', nameKa: 'yenikapi', lat: 41.0079, lng: 28.9498, line: 'M1A / M2 / T1', citySlug: 'istanbul', cc: 'TR', yearOpened: 1989, interchange: true },
    { slug: 'taksim', name: 'Taksim', nameKa: 'taksim', lat: 41.0370, lng: 28.9852, line: 'M2 / F1', citySlug: 'istanbul', cc: 'TR', yearOpened: 2000, interchange: true },
    { slug: 'sisli-mecidiyekoy', name: 'Sisli-Mecidiyekoy', nameKa: 'sisli-mecidiyekoy', lat: 41.0613, lng: 28.9917, line: 'M2 / M7', citySlug: 'istanbul', cc: 'TR', yearOpened: 2000, interchange: true },
    { slug: 'levent', name: 'Levent', nameKa: 'levent', lat: 41.0822, lng: 29.0100, line: 'M2 / M6', citySlug: 'istanbul', cc: 'TR', yearOpened: 2000, interchange: true },
    { slug: 'kadikoy', name: 'Kadikoy', nameKa: 'kadikoy', lat: 40.9897, lng: 29.0261, line: 'M4 / T3 / Ferry', citySlug: 'istanbul', cc: 'TR', yearOpened: 2012, interchange: true },
    { slug: 'sultanahmet', name: 'Sultanahmet', nameKa: 'sultanahmet', lat: 40.9970, lng: 28.9797, line: 'T1', citySlug: 'istanbul', cc: 'TR', yearOpened: 1992, interchange: false },
    { slug: 'eminonu', name: 'Eminonu', nameKa: 'eminonu', lat: 41.0167, lng: 28.9705, line: 'T1 / T2', citySlug: 'istanbul', cc: 'TR', yearOpened: 1992, interchange: true },
    { slug: 'ataturk-havalimani', name: 'Ataturk Havalimani', nameKa: 'ataturk-havalimani', lat: 40.9828, lng: 28.8117, line: 'M1A', citySlug: 'istanbul', cc: 'TR', yearOpened: 1989, interchange: false },
    { slug: 'bagcilar', name: 'Bagcilar', nameKa: 'bagcilar', lat: 41.0390, lng: 28.8586, line: 'M1B / T1', citySlug: 'istanbul', cc: 'TR', yearOpened: 1994, interchange: true },
  ],
}

const ankaraMetro: MetroSystemData = {
  citySlug: 'ankara',
  cc: 'TR',
  name: 'Ankara Metro',
  status: 'operational',
  totalKm: 57.0,
  totalStations: 48,
  yearOpened: 1997,
  dailyRidership: 400_000,
  lines: [
    { name: 'Ankaray (A1)', color: '#C60C30', stations: 11, km: 8.5, yearOpened: 1997 },
    { name: 'M1 (Dikimevi-Kecioeren)', color: '#0068B5', stations: 12, km: 14.5, yearOpened: 1997 },
    { name: 'M2 (Kizilay-Batikent)', color: '#009846', stations: 13, km: 16.5, yearOpened: 2002 },
    { name: 'M3 (Torekent-Batikent)', color: '#E30613', stations: 12, km: 15.7, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'kizilay', name: 'Kizilay', nameKa: 'kizilay', lat: 39.9199, lng: 32.8543, line: 'Ankaray / M2', citySlug: 'ankara', cc: 'TR', yearOpened: 1997, interchange: true },
    { slug: 'ulus', name: 'Ulus', nameKa: 'ulus', lat: 39.9428, lng: 32.8537, line: 'Ankaray', citySlug: 'ankara', cc: 'TR', yearOpened: 1997, interchange: false },
    { slug: 'kecioren', name: 'Kecioeren', nameKa: 'kecioren', lat: 39.9856, lng: 32.8219, line: 'M1', citySlug: 'ankara', cc: 'TR', yearOpened: 1997, interchange: false },
  ],
}

const izmirMetro: MetroSystemData = {
  citySlug: 'izmir',
  cc: 'TR',
  name: 'Izmir Metro',
  status: 'operational',
  totalKm: 38.0,
  totalStations: 30,
  yearOpened: 2000,
  dailyRidership: 200_000,
  lines: [
    { name: 'M1 (Kaymakamlik-Evka 3)', color: '#0068B5', stations: 18, km: 20.0, yearOpened: 2000 },
    { name: 'M2 (Fahrettin Altay-Narlidere)', color: '#009846', stations: 10, km: 7.5, yearOpened: 2024 },
  ],
  stations: [
    { slug: 'konak', name: 'Konak', nameKa: 'konak', lat: 38.4189, lng: 27.1285, line: 'M1 / Tram', citySlug: 'izmir', cc: 'TR', yearOpened: 2000, interchange: true },
    { slug: 'basmane', name: 'Basmane', nameKa: 'basmane', lat: 38.4206, lng: 27.1454, line: 'M1', citySlug: 'izmir', cc: 'TR', yearOpened: 2000, interchange: false },
  ],
}

const telAvivMetro: MetroSystemData = {
  citySlug: 'tel-aviv',
  cc: 'IL',
  name: 'Tel Aviv Light Rail',
  status: 'operational',
  totalKm: 25.0,
  totalStations: 34,
  yearOpened: 2023,
  dailyRidership: 100_000,
  lines: [
    { name: 'Red Line', color: '#E2231A', stations: 34, km: 25.0, yearOpened: 2023 },
  ],
  stations: [
    { slug: 'ha-shalom', name: 'HaShalom', nameKa: 'ha-shalom', lat: 32.0731, lng: 34.7923, line: 'Red', citySlug: 'tel-aviv', cc: 'IL', yearOpened: 2023, interchange: false },
    { slug: 'dizengoff', name: 'Dizengoff', nameKa: 'dizengoff', lat: 32.0749, lng: 34.7728, line: 'Red', citySlug: 'tel-aviv', cc: 'IL', yearOpened: 2023, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — UNITED KINGDOM
// ────────────────────────────────────────────────────────────────

const londonTube: MetroSystemData = {
  citySlug: 'london',
  cc: 'GB',
  name: 'London Underground / Overground / DLR / Elizabeth Line',
  status: 'operational',
  totalKm: 402.0,
  totalStations: 272,
  yearOpened: 1863,
  dailyRidership: 4_800_000,
  lines: [
    { name: 'Bakerloo', color: '#87431D', stations: 25, km: 23.2, yearOpened: 1906 },
    { name: 'Central', color: '#DC241F', stations: 49, km: 74.0, yearOpened: 1900 },
    { name: 'Circle', color: '#FFD300', stations: 36, km: 27.2, yearOpened: 1884 },
    { name: 'District', color: '#00A551', stations: 60, km: 64.0, yearOpened: 1868 },
    { name: 'Hammersmith & City', color: '#D799AF', stations: 29, km: 25.5, yearOpened: 1863 },
    { name: 'Jubilee', color: '#6E7B8B', stations: 27, km: 36.2, yearOpened: 1979 },
    { name: 'Metropolitan', color: '#751056', stations: 34, km: 66.7, yearOpened: 1863 },
    { name: 'Northern', color: '#000000', stations: 52, km: 58.0, yearOpened: 1890 },
    { name: 'Piccadilly', color: '#003688', stations: 53, km: 71.0, yearOpened: 1906 },
    { name: 'Victoria', color: '#0098D4', stations: 16, km: 21.0, yearOpened: 1968 },
    { name: 'Waterloo & City', color: '#76B023', stations: 2, km: 2.5, yearOpened: 1898 },
    { name: 'Elizabeth Line', color: '#6950A1', stations: 41, km: 118.0, yearOpened: 2022 },
    { name: 'DLR', color: '#00A4D4', stations: 45, km: 34.0, yearOpened: 1987 },
    { name: 'London Overground', color: '#EE7C0D', stations: 112, km: 167.0, yearOpened: 2007 },
  ],
  stations: [
    { slug: 'baker-street', name: 'Baker Street', nameKa: 'baker-street', lat: 51.5228, lng: -0.1573, line: 'Metropolitan / Bakerloo / Circle / H&C / Jubilee', citySlug: 'london', cc: 'GB', yearOpened: 1863, interchange: true },
    { slug: 'bank', name: 'Bank', nameKa: 'bank', lat: 51.5134, lng: -0.0888, line: 'Central / Northern / Waterloo & City / DLR / Elizabeth', citySlug: 'london', cc: 'GB', yearOpened: 1898, interchange: true },
    { slug: 'waterloo', name: 'Waterloo', nameKa: 'waterloo', lat: 51.5031, lng: -0.1131, line: 'Bakerloo / Northern / Jubilee / Waterloo & City', citySlug: 'london', cc: 'GB', yearOpened: 1898, interchange: true },
    { slug: 'kings-cross', name: "Kings Cross St Pancras", nameKa: 'kings-cross', lat: 51.5309, lng: -0.1238, line: 'Metropolitan / Circle / H&C / Northern / Victoria / Piccadilly', citySlug: 'london', cc: 'GB', yearOpened: 1863, interchange: true },
    { slug: 'paddington', name: 'Paddington', nameKa: 'paddington', lat: 51.5154, lng: -0.1757, line: 'Bakerloo / Circle / District / H&C / Elizabeth', citySlug: 'london', cc: 'GB', yearOpened: 1863, interchange: true },
    { slug: 'oxford-circus', name: 'Oxford Circus', nameKa: 'oxford-circus', lat: 51.5149, lng: -0.1344, line: 'Bakerloo / Central / Victoria', citySlug: 'london', cc: 'GB', yearOpened: 1900, interchange: true },
    { slug: 'victoria', name: 'Victoria', nameKa: 'victoria', lat: 51.4965, lng: -0.1447, line: 'Victoria / District / Circle', citySlug: 'london', cc: 'GB', yearOpened: 1868, interchange: true },
    { slug: 'liverpool-street', name: 'Liverpool Street', nameKa: 'liverpool-street', lat: 51.5176, lng: -0.0810, line: 'Metropolitan / Central / Circle / H&C / Elizabeth', citySlug: 'london', cc: 'GB', yearOpened: 1875, interchange: true },
    { slug: 'canary-wharf', name: 'Canary Wharf', nameKa: 'canary-wharf', lat: 51.5054, lng: -0.0235, line: 'Jubilee / Elizabeth / DLR', citySlug: 'london', cc: 'GB', yearOpened: 1999, interchange: true },
    { slug: 'green-park', name: 'Green Park', nameKa: 'green-park', lat: 51.5067, lng: -0.1428, line: 'Piccadilly / Victoria / Jubilee', citySlug: 'london', cc: 'GB', yearOpened: 1906, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — FRANCE
// ────────────────────────────────────────────────────────────────

const parisMetro: MetroSystemData = {
  citySlug: 'paris',
  cc: 'FR',
  name: 'Paris Metro / RER',
  status: 'operational',
  totalKm: 245.0,
  totalStations: 308,
  yearOpened: 1900,
  dailyRidership: 5_800_000,
  lines: [
    { name: 'Line 1', color: '#FFCD00', stations: 25, km: 16.6, yearOpened: 1900 },
    { name: 'Line 2', color: '#0055A4', stations: 25, km: 12.3, yearOpened: 1900 },
    { name: 'Line 3', color: '#6F4235', stations: 25, km: 11.7, yearOpened: 1904 },
    { name: 'Line 4', color: '#9B26B6', stations: 27, km: 12.1, yearOpened: 1908 },
    { name: 'Line 5', color: '#E30613', stations: 22, km: 14.6, yearOpened: 1906 },
    { name: 'Line 6', color: '#6CCFF5', stations: 28, km: 13.7, yearOpened: 1909 },
    { name: 'Line 7', color: '#F0903C', stations: 38, km: 18.8, yearOpened: 1910 },
    { name: 'Line 8', color: '#CF7BA0', stations: 37, km: 23.3, yearOpened: 1913 },
    { name: 'Line 9', color: '#CFCC00', stations: 37, km: 19.6, yearOpened: 1922 },
    { name: 'Line 10', color: '#C39BD3', stations: 23, km: 11.7, yearOpened: 1913 },
    { name: 'Line 11', color: '#704A2E', stations: 13, km: 6.3, yearOpened: 1935 },
    { name: 'Line 12', color: '#009F5E', stations: 31, km: 16.3, yearOpened: 1910 },
    { name: 'Line 13', color: '#7FC6D3', stations: 32, km: 24.3, yearOpened: 1911 },
    { name: 'Line 14', color: '#62256B', stations: 9, km: 14.0, yearOpened: 1998 },
  ],
  stations: [
    { slug: 'chatelet', name: 'Chatelet', nameKa: 'chatelet', lat: 48.8582, lng: 2.3472, line: '1 / 4 / 7 / 11 / 14 / RER A/B/D', citySlug: 'paris', cc: 'FR', yearOpened: 1900, interchange: true },
    { slug: 'gare-du-nord', name: 'Gare du Nord', nameKa: 'gare-du-nord', lat: 48.8809, lng: 2.3553, line: '4 / 5 / RER B/D', citySlug: 'paris', cc: 'FR', yearOpened: 1904, interchange: true },
    { slug: 'montparnasse', name: 'Montparnasse', nameKa: 'montparnasse', lat: 48.8413, lng: 2.3223, line: '4 / 6 / 12 / 13', citySlug: 'paris', cc: 'FR', yearOpened: 1906, interchange: true },
    { slug: 'republique', name: 'Republique', nameKa: 'republique', lat: 48.8677, lng: 2.3630, line: '3 / 5 / 8 / 9 / 11', citySlug: 'paris', cc: 'FR', yearOpened: 1904, interchange: true },
    { slug: 'gare-de-lyon', name: 'Gare de Lyon', nameKa: 'gare-de-lyon', lat: 48.8447, lng: 2.3734, line: '1 / 14 / RER A/D', citySlug: 'paris', cc: 'FR', yearOpened: 1900, interchange: true },
    { slug: 'denfert-rochereau', name: 'Denfert-Rochereau', nameKa: 'denfert-rochereau', lat: 48.8336, lng: 2.3323, line: '4 / 6 / RER B', citySlug: 'paris', cc: 'FR', yearOpened: 1908, interchange: true },
    { slug: 'bastille', name: 'Bastille', nameKa: 'bastille', lat: 48.8531, lng: 2.3694, line: '1 / 5 / 8', citySlug: 'paris', cc: 'FR', yearOpened: 1900, interchange: true },
    { slug: 'st-michel', name: 'Saint-Michel', nameKa: 'st-michel', lat: 48.8535, lng: 2.3441, line: '4 / RER B/C', citySlug: 'paris', cc: 'FR', yearOpened: 1908, interchange: true },
    { slug: 'la-defense', name: 'La Defense', nameKa: 'la-defense', lat: 48.8917, lng: 2.2361, line: '1 / RER A', citySlug: 'paris', cc: 'FR', yearOpened: 1992, interchange: true },
    { slug: 'pigalle', name: 'Pigalle', nameKa: 'pigalle', lat: 48.8821, lng: 2.3319, line: '2 / 12', citySlug: 'paris', cc: 'FR', yearOpened: 1902, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — GERMANY
// ────────────────────────────────────────────────────────────────

const berlinMetro: MetroSystemData = {
  citySlug: 'berlin',
  cc: 'DE',
  name: 'Berlin U-Bahn / S-Bahn',
  status: 'operational',
  totalKm: 192.0,
  totalStations: 173,
  yearOpened: 1902,
  dailyRidership: 2_500_000,
  lines: [
    { name: 'U1', color: '#F5D122', stations: 13, km: 8.8, yearOpened: 1902 },
    { name: 'U2', color: '#E44585', stations: 29, km: 20.7, yearOpened: 1913 },
    { name: 'U3', color: '#009688', stations: 24, km: 12.0, yearOpened: 1913 },
    { name: 'U5', color: '#7B5D37', stations: 26, km: 19.5, yearOpened: 1930 },
    { name: 'U6', color: '#006F40', stations: 29, km: 19.9, yearOpened: 1923 },
    { name: 'U7', color: '#6A1E74', stations: 40, km: 31.8, yearOpened: 1924 },
    { name: 'U8', color: '#00A1DE', stations: 23, km: 17.5, yearOpened: 1927 },
    { name: 'U9', color: '#B5BE2E', stations: 18, km: 12.5, yearOpened: 1961 },
  ],
  stations: [
    { slug: 'alexanderplatz', name: 'Alexanderplatz', nameKa: 'alexanderplatz', lat: 52.5219, lng: 13.4132, line: 'U2 / U5 / S5 / S7 / S9', citySlug: 'berlin', cc: 'DE', yearOpened: 1913, interchange: true },
    { slug: 'friedrichstr', name: 'Friedrichstr', nameKa: 'friedrichstr', lat: 52.5206, lng: 13.3867, line: 'U6 / S1 / S2 / S5 / S7 / S25', citySlug: 'berlin', cc: 'DE', yearOpened: 1923, interchange: true },
    { slug: 'hauptbahnhof', name: 'Berlin Hauptbahnhof', nameKa: 'berlin-hauptbahnhof', lat: 52.5253, lng: 13.3694, line: 'S5 / S7 / S9 / S75', citySlug: 'berlin', cc: 'DE', yearOpened: 2006, interchange: true },
    { slug: 'kurfuerstendamm', name: 'Kurfurstendamm', nameKa: 'kurfurstendamm', lat: 52.5039, lng: 13.3373, line: 'U1 / U2 / U9', citySlug: 'berlin', cc: 'DE', yearOpened: 1907, interchange: true },
    { slug: 'potsdamer-platz', name: 'Potsdamer Platz', nameKa: 'potsdamer-platz', lat: 52.5091, lng: 13.3758, line: 'U2 / S1 / S2 / S25', citySlug: 'berlin', cc: 'DE', yearOpened: 1902, interchange: true },
    { slug: 'wittenbergplatz', name: 'Wittenbergplatz', nameKa: 'wittenbergplatz', lat: 52.5019, lng: 13.3378, line: 'U1 / U2 / U3', citySlug: 'berlin', cc: 'DE', yearOpened: 1902, interchange: true },
    { slug: 'neukoelln', name: 'Neukolln', nameKa: 'neukolln', lat: 52.4781, lng: 13.4318, line: 'U7', citySlug: 'berlin', cc: 'DE', yearOpened: 1927, interchange: false },
    { slug: 'spittelmarkt', name: 'Spittelmarkt', nameKa: 'spittelmarkt', lat: 52.5148, lng: 13.4025, line: 'U2', citySlug: 'berlin', cc: 'DE', yearOpened: 1913, interchange: false },
  ],
}

const munichMetro: MetroSystemData = {
  citySlug: 'munich',
  cc: 'DE',
  name: 'Munich U-Bahn / S-Bahn',
  status: 'operational',
  totalKm: 103.0,
  totalStations: 96,
  yearOpened: 1972,
  dailyRidership: 1_100_000,
  lines: [
    { name: 'U1', color: '#00953B', stations: 13, km: 12.0, yearOpened: 1980 },
    { name: 'U2', color: '#C8102E', stations: 27, km: 24.0, yearOpened: 1980 },
    { name: 'U3', color: '#F5D122', stations: 18, km: 19.0, yearOpened: 1972 },
    { name: 'U6', color: '#009F8F', stations: 24, km: 27.0, yearOpened: 1972 },
    { name: 'S-Bahn (10 lines)', color: '#999999', stations: 50, km: 95.0, yearOpened: 1972 },
  ],
  stations: [
    { slug: 'marienplatz', name: 'Marienplatz', nameKa: 'marienplatz', lat: 48.1372, lng: 11.5755, line: 'U3 / U6 / S-Bahn', citySlug: 'munich', cc: 'DE', yearOpened: 1972, interchange: true },
    { slug: 'hbf-munich', name: 'Hauptbahnhof', nameKa: 'hbf-munich', lat: 48.1397, lng: 11.5598, line: 'U1 / U2 / S-Bahn', citySlug: 'munich', cc: 'DE', yearOpened: 1972, interchange: true },
    { slug: 'sendlinger-tor', name: 'Sendlinger Tor', nameKa: 'sendlinger-tor', lat: 48.1336, lng: 11.5667, line: 'U1 / U2 / U3 / U6', citySlug: 'munich', cc: 'DE', yearOpened: 1980, interchange: true },
    { slug: 'oedplatz', name: 'Odeonsplatz', nameKa: 'odeonsplatz', lat: 48.1430, lng: 11.5794, line: 'U3 / U6', citySlug: 'munich', cc: 'DE', yearOpened: 1972, interchange: true },
    { slug: 'schwabing', name: 'Universitat', nameKa: 'universitat', lat: 48.1524, lng: 11.5801, line: 'U3 / U6', citySlug: 'munich', cc: 'DE', yearOpened: 1972, interchange: true },
  ],
}

const hamburgMetro: MetroSystemData = {
  citySlug: 'hamburg',
  cc: 'DE',
  name: 'Hamburg U-Bahn / S-Bahn',
  status: 'operational',
  totalKm: 139.0,
  totalStations: 107,
  yearOpened: 1906,
  dailyRidership: 850_000,
  lines: [
    { name: 'U1', color: '#C8102E', stations: 25, km: 19.7, yearOpened: 1912 },
    { name: 'U2', color: '#0055A4', stations: 23, km: 20.2, yearOpened: 1913 },
    { name: 'U3', color: '#6D3E1E', stations: 25, km: 20.6, yearOpened: 1906 },
    { name: 'U4', color: '#009F8F', stations: 12, km: 8.5, yearOpened: 2012 },
    { name: 'S-Bahn (6 lines)', color: '#006633', stations: 48, km: 87.0, yearOpened: 1907 },
  ],
  stations: [
    { slug: 'hbf-hamburg', name: 'Hauptbahnhof', nameKa: 'hbf-hamburg', lat: 53.5527, lng: 10.0064, line: 'U1 / U2 / U3 / S-Bahn', citySlug: 'hamburg', cc: 'DE', yearOpened: 1906, interchange: true },
    { slug: 'bahnhof-landungsbruecken', name: 'Landungsbrucken', nameKa: 'landungsbruecken', lat: 53.5470, lng: 9.9647, line: 'U3 / S-Bahn', citySlug: 'hamburg', cc: 'DE', yearOpened: 1906, interchange: true },
    { slug: 'berner-ged', name: 'Berliner Tor', nameKa: 'berliner-tor', lat: 53.5520, lng: 10.0237, line: 'U2 / U3 / S-Bahn', citySlug: 'hamburg', cc: 'DE', yearOpened: 1912, interchange: true },
  ],
}

const frankfurtMetro: MetroSystemData = {
  citySlug: 'frankfurt',
  cc: 'DE',
  name: 'Frankfurt U-Bahn / S-Bahn',
  status: 'operational',
  totalKm: 125.0,
  totalStations: 86,
  yearOpened: 1968,
  dailyRidership: 600_000,
  lines: [
    { name: 'U1', color: '#C8102E', stations: 15, km: 12.8, yearOpened: 1968 },
    { name: 'U2', color: '#0055A4', stations: 15, km: 13.2, yearOpened: 1968 },
    { name: 'U3', color: '#00953B', stations: 17, km: 15.3, yearOpened: 1968 },
    { name: 'U4', color: '#F5D122', stations: 14, km: 12.3, yearOpened: 1980 },
    { name: 'U5', color: '#E30613', stations: 11, km: 12.8, yearOpened: 1980 },
    { name: 'U6', color: '#7B5D37', stations: 12, km: 12.5, yearOpened: 1999 },
    { name: 'U7', color: '#009F8F', stations: 11, km: 11.3, yearOpened: 1999 },
    { name: 'U8', color: '#7B5D37', stations: 8, km: 8.0, yearOpened: 1999 },
    { name: 'S-Bahn (9 lines)', color: '#006633', stations: 50, km: 86.0, yearOpened: 1978 },
  ],
  stations: [
    { slug: 'hbf-frankfurt', name: 'Hauptbahnhof', nameKa: 'hbf-frankfurt', lat: 50.1072, lng: 8.6638, line: 'U4 / U5 / S-Bahn', citySlug: 'frankfurt', cc: 'DE', yearOpened: 1968, interchange: true },
    { slug: 'zoo', name: 'Zoo', nameKa: 'zoo', lat: 50.1140, lng: 8.6964, line: 'U5 / U6 / U7 / U8', citySlug: 'frankfurt', cc: 'DE', yearOpened: 1968, interchange: true },
    { slug: 'konstablerwache', name: 'Konstablerwache', nameKa: 'konstablerwache', lat: 50.1134, lng: 8.6843, line: 'U4 / U6 / U7 / U8 / S-Bahn', citySlug: 'frankfurt', cc: 'DE', yearOpened: 1968, interchange: true },
  ],
}

const cologneMetro: MetroSystemData = {
  citySlug: 'cologne',
  cc: 'DE',
  name: 'Cologne Stadtbahn',
  status: 'operational',
  totalKm: 70.0,
  totalStations: 62,
  yearOpened: 1968,
  dailyRidership: 350_000,
  lines: [
    { name: 'Line 1', color: '#C8102E', stations: 22, km: 18.5, yearOpened: 1968 },
    { name: 'Line 3', color: '#0055A4', stations: 18, km: 15.0, yearOpened: 1968 },
    { name: 'Line 4', color: '#00953B', stations: 14, km: 12.0, yearOpened: 1968 },
    { name: 'Line 5', color: '#F5D122', stations: 10, km: 8.0, yearOpened: 1968 },
    { name: 'Line 6', color: '#E30613', stations: 8, km: 6.0, yearOpened: 1975 },
    { name: 'Line 7', color: '#00A1DE', stations: 6, km: 5.0, yearOpened: 1975 },
    { name: 'Line 8', color: '#9B26B6', stations: 5, km: 4.0, yearOpened: 1975 },
    { name: 'Line 9', color: '#7B5D37', stations: 5, km: 4.5, yearOpened: 1975 },
  ],
  stations: [
    { slug: 'neumarkt', name: 'Neumarkt', nameKa: 'neumarkt', lat: 50.9361, lng: 6.9531, line: 'Line 1 / 3 / 4 / 5 / 6 / 7 / 9 / 12 / 13 / 15 / 16 / 17 / 18 / 19', citySlug: 'cologne', cc: 'DE', yearOpened: 1968, interchange: true },
    { slug: 'hbf-cologne', name: 'Hauptbahnhof', nameKa: 'hbf-cologne', lat: 50.9429, lng: 6.9585, line: 'Line 1 / 3 / 5 / 7 / 8 / 9', citySlug: 'cologne', cc: 'DE', yearOpened: 1968, interchange: true },
  ],
}

const stuttgartMetro: MetroSystemData = {
  citySlug: 'stuttgart',
  cc: 'DE',
  name: 'Stuttgart Stadtbahn',
  status: 'operational',
  totalKm: 64.0,
  totalStations: 57,
  yearOpened: 1975,
  dailyRidership: 300_000,
  lines: [
    { name: 'U1', color: '#C8102E', stations: 16, km: 12.0, yearOpened: 1975 },
    { name: 'U2', color: '#0055A4', stations: 22, km: 19.0, yearOpened: 1975 },
    { name: 'U3', color: '#00953B', stations: 17, km: 14.0, yearOpened: 1985 },
    { name: 'U4', color: '#F5D122', stations: 14, km: 10.0, yearOpened: 1991 },
    { name: 'U5', color: '#E30613', stations: 12, km: 9.0, yearOpened: 1991 },
    { name: 'U6', color: '#7B5D37', stations: 10, km: 8.0, yearOpened: 1991 },
    { name: 'U7', color: '#009F8F', stations: 9, km: 7.0, yearOpened: 1991 },
    { name: 'U9', color: '#9B26B6', stations: 5, km: 5.0, yearOpened: 1993 },
  ],
  stations: [
    { slug: 'charlottenplatz', name: 'Charlottenplatz', nameKa: 'charlottenplatz', lat: 48.7753, lng: 9.1804, line: 'U1 / U2 / U4 / U5 / U6 / U7', citySlug: 'stuttgart', cc: 'DE', yearOpened: 1975, interchange: true },
    { slug: 'hbf-stuttgart', name: 'Hauptbahnhof', nameKa: 'hbf-stuttgart', lat: 48.7839, lng: 9.1811, line: 'U1 / U2 / U3 / U5 / U6 / U7 / U9 / S-Bahn', citySlug: 'stuttgart', cc: 'DE', yearOpened: 1975, interchange: true },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — SPAIN
// ────────────────────────────────────────────────────────────────

const madridMetro: MetroSystemData = {
  citySlug: 'madrid',
  cc: 'ES',
  name: 'Madrid Metro',
  status: 'operational',
  totalKm: 294.0,
  totalStations: 301,
  yearOpened: 1919,
  dailyRidership: 2_400_000,
  lines: [
    { name: 'Line 1', color: '#0068B5', stations: 33, km: 23.9, yearOpened: 1919 },
    { name: 'Line 2', color: '#E30613', stations: 20, km: 14.1, yearOpened: 1924 },
    { name: 'Line 3', color: '#F5D122', stations: 18, km: 14.0, yearOpened: 1968 },
    { name: 'Line 4', color: '#C86A2C', stations: 15, km: 14.7, yearOpened: 1973 },
    { name: 'Line 5', color: '#7B5D37', stations: 32, km: 28.2, yearOpened: 1968 },
    { name: 'Line 6', color: '#999999', stations: 28, km: 23.6, yearOpened: 1979 },
    { name: 'Line 7', color: '#00953B', stations: 30, km: 32.9, yearOpened: 1974 },
    { name: 'Line 8', color: '#999999', stations: 15, km: 16.5, yearOpened: 1982 },
    { name: 'Line 9', color: '#7B5D37', stations: 29, km: 39.5, yearOpened: 1980 },
    { name: 'Line 10', color: '#003DA5', stations: 31, km: 36.5, yearOpened: 1961 },
    { name: 'Line 11', color: '#C86A2C', stations: 7, km: 6.5, yearOpened: 1998 },
    { name: 'Line 12', color: '#F5D122', stations: 28, km: 40.6, yearOpened: 2003 },
    { name: 'Line R', color: '#E30613', stations: 8, km: 3.9, yearOpened: 1998 },
  ],
  stations: [
    { slug: 'puerta-del-sol', name: 'Puerta del Sol', nameKa: 'puerta-del-sol', lat: 40.4169, lng: -3.7033, line: 'Line 1 / 2 / 3', citySlug: 'madrid', cc: 'ES', yearOpened: 1919, interchange: true },
    { slug: 'gran-via', name: 'Gran Via', nameKa: 'gran-via', lat: 40.4200, lng: -3.7026, line: 'Line 1 / 5', citySlug: 'madrid', cc: 'ES', yearOpened: 1919, interchange: true },
    { slug: 'aeropuerto-t1', name: 'Aeropuerto T1', nameKa: 'aeropuerto-t1', lat: 40.4937, lng: -3.5943, line: 'Line 8', citySlug: 'madrid', cc: 'ES', yearOpened: 1999, interchange: true },
    { slug: 'sol', name: 'Sol', nameKa: 'sol', lat: 40.4169, lng: -3.7033, line: 'Line 1 / 2 / 3', citySlug: 'madrid', cc: 'ES', yearOpened: 1919, interchange: true },
    { slug: 'opera', name: 'Opera', nameKa: 'opera', lat: 40.4184, lng: -3.7146, line: 'Line 2 / 5 / Ramal', citySlug: 'madrid', cc: 'ES', yearOpened: 1925, interchange: true },
    { slug: 'chamartin', name: 'Chamartin', nameKa: 'chamartin', lat: 40.4723, lng: -3.6830, line: 'Line 1 / 10 / Cercanias', citySlug: 'madrid', cc: 'ES', yearOpened: 1961, interchange: true },
    { slug: 'callao', name: 'Callao', nameKa: 'callao', lat: 40.4202, lng: -3.7029, line: 'Line 3 / 5', citySlug: 'madrid', cc: 'ES', yearOpened: 1968, interchange: true },
    { slug: 'nuevos-ministerios', name: 'Nuevos Ministerios', nameKa: 'nuevos-ministerios', lat: 40.4466, lng: -3.6922, line: 'Line 6 / 8 / 10', citySlug: 'madrid', cc: 'ES', yearOpened: 1961, interchange: true },
  ],
}

const barcelonaMetro: MetroSystemData = {
  citySlug: 'barcelona',
  cc: 'ES',
  name: 'Barcelona Metro / FGC',
  status: 'operational',
  totalKm: 170.0,
  totalStations: 180,
  yearOpened: 1924,
  dailyRidership: 1_400_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 30, km: 20.7, yearOpened: 1926 },
    { name: 'Line 2', color: '#A51890', stations: 18, km: 12.9, yearOpened: 1959 },
    { name: 'Line 3', color: '#00953B', stations: 26, km: 18.4, yearOpened: 1924 },
    { name: 'Line 4', color: '#C86A2C', stations: 22, km: 16.8, yearOpened: 1973 },
    { name: 'Line 5', color: '#0055A4', stations: 27, km: 17.3, yearOpened: 1975 },
    { name: 'Line 9', color: '#9B26B6', stations: 52, km: 47.8, yearOpened: 2009 },
    { name: 'Line 10', color: '#00A1DE', stations: 14, km: 12.0, yearOpened: 2010 },
    { name: 'Line 11', color: '#C86A2C', stations: 5, km: 2.1, yearOpened: 2003 },
    { name: 'Line 12', color: '#00953B', stations: 4, km: 2.0, yearOpened: 2003 },
  ],
  stations: [
    { slug: 'placa-catalunya', name: 'Placa Catalunya', nameKa: 'placa-catalunya', lat: 41.3870, lng: 2.1701, line: 'L1 / L3 / FGC', citySlug: 'barcelona', cc: 'ES', yearOpened: 1924, interchange: true },
    { slug: 'diagonal', name: 'Diagonal', nameKa: 'diagonal', lat: 41.3916, lng: 2.1639, line: 'L3 / L5 / FGC', citySlug: 'barcelona', cc: 'ES', yearOpened: 1959, interchange: true },
    { slug: 'sants', name: 'Sants', nameKa: 'sants', lat: 41.3791, lng: 2.1404, line: 'L1 / L3 / Rodalies', citySlug: 'barcelona', cc: 'ES', yearOpened: 1975, interchange: true },
    { slug: 'gracia', name: 'Gracia', nameKa: 'gracia', lat: 41.4018, lng: 2.1607, line: 'L3 / L4 / FGC', citySlug: 'barcelona', cc: 'ES', yearOpened: 1924, interchange: true },
    { slug: 'pg-de-gracia', name: 'Passeig de Gracia', nameKa: 'pg-de-gracia', lat: 41.3931, lng: 2.1683, line: 'L2 / L3 / L4', citySlug: 'barcelona', cc: 'ES', yearOpened: 1924, interchange: true },
    { slug: 'sagrada-familia', name: 'Sagrada Familia', nameKa: 'sagrada-familia', lat: 41.4036, lng: 2.1744, line: 'L2 / L5', citySlug: 'barcelona', cc: 'ES', yearOpened: 1959, interchange: true },
    { slug: 'eixample', name: 'Universitat', nameKa: 'universitat', lat: 41.3868, lng: 2.1633, line: 'L1 / L2', citySlug: 'barcelona', cc: 'ES', yearOpened: 1926, interchange: true },
    { slug: 'fira', name: 'Fira', nameKa: 'fira', lat: 41.3540, lng: 2.1340, line: 'L3 / L8 / FGC', citySlug: 'barcelona', cc: 'ES', yearOpened: 2003, interchange: true },
  ],
}

const valenciaMetro: MetroSystemData = {
  citySlug: 'valencia',
  cc: 'ES',
  name: 'Valencia Metro / FGV',
  status: 'operational',
  totalKm: 160.0,
  totalStations: 136,
  yearOpened: 1988,
  dailyRidership: 250_000,
  lines: [
    { name: 'Line 1 (Metrovalencia)', color: '#E30613', stations: 37, km: 32.0, yearOpened: 1988 },
    { name: 'Line 2', color: '#0055A4', stations: 26, km: 24.0, yearOpened: 1994 },
    { name: 'Line 3', color: '#00953B', stations: 24, km: 22.0, yearOpened: 1994 },
    { name: 'Line 4', color: '#F5D122', stations: 15, km: 15.0, yearOpened: 2007 },
    { name: 'Line 5', color: '#7B5D37', stations: 8, km: 6.0, yearOpened: 2003 },
    { name: 'Line 6', color: '#00A1DE', stations: 4, km: 4.0, yearOpened: 2010 },
    { name: 'Line 7', color: '#C86A2C', stations: 16, km: 18.0, yearOpened: 2010 },
    { name: 'Line 8', color: '#E30613', stations: 6, km: 6.0, yearOpened: 2010 },
    { name: 'Line 9', color: '#0055A4', stations: 5, km: 5.0, yearOpened: 2015 },
    { name: 'Line 10', color: '#00953B', stations: 5, km: 5.0, yearOpened: 2015 },
  ],
  stations: [
    { slug: 'colón', name: 'Colon', nameKa: 'colon', lat: 39.4699, lng: -0.3631, line: 'Line 3 / 5 / 7 / 9', citySlug: 'valencia', cc: 'ES', yearOpened: 1988, interchange: true },
    { slug: 'xàtiva', name: 'Xativa', nameKa: 'xativa', lat: 39.4652, lng: -0.3520, line: 'Line 3 / 5 / 7 / 9', citySlug: 'valencia', cc: 'ES', yearOpened: 1988, interchange: true },
    { slug: 'aeroport', name: 'Aeroport', nameKa: 'aeroport', lat: 39.4920, lng: -0.4733, line: 'Line 3', citySlug: 'valencia', cc: 'ES', yearOpened: 2007, interchange: false },
  ],
}

const bilbaoMetro: MetroSystemData = {
  citySlug: 'bilbao',
  cc: 'ES',
  name: 'Bilbao Metro',
  status: 'operational',
  totalKm: 43.0,
  totalStations: 41,
  yearOpened: 1995,
  dailyRidership: 200_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 23, km: 22.0, yearOpened: 1995 },
    { name: 'Line 2', color: '#00953B', stations: 18, km: 21.0, yearOpened: 2017 },
  ],
  stations: [
    { slug: 'casco-viejo', name: 'Casco Viejo', nameKa: 'casco-viejo', lat: 43.2602, lng: -2.9261, line: 'Line 1 / 2', citySlug: 'bilbao', cc: 'ES', yearOpened: 1995, interchange: true },
    { slug: 'abando', name: 'Abando', nameKa: 'abando', lat: 43.2617, lng: -2.9292, line: 'Line 1 / 2', citySlug: 'bilbao', cc: 'ES', yearOpened: 1995, interchange: true },
    { slug: 'san-mames', name: 'San Mames', nameKa: 'san-mames', lat: 43.2645, lng: -2.9422, line: 'Line 1 / Euskotren', citySlug: 'bilbao', cc: 'ES', yearOpened: 1995, interchange: true },
  ],
}

const sevilleMetro: MetroSystemData = {
  citySlug: 'seville',
  cc: 'ES',
  name: 'Seville Metro',
  status: 'operational',
  totalKm: 18.0,
  totalStations: 22,
  yearOpened: 2009,
  dailyRidership: 100_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 22, km: 18.0, yearOpened: 2009 },
  ],
  stations: [
    { slug: 'ciudad-justicia', name: 'Ciudad Justicia', nameKa: 'ciudad-justicia', lat: 37.3759, lng: -5.9715, line: 'Line 1', citySlug: 'seville', cc: 'ES', yearOpened: 2009, interchange: false },
    { slug: 'puerta-jerez', name: 'Puerta Jerez', nameKa: 'puerta-jerez', lat: 37.3880, lng: -5.9900, line: 'Line 1', citySlug: 'seville', cc: 'ES', yearOpened: 2009, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — ITALY
// ────────────────────────────────────────────────────────────────

const romeMetro: MetroSystemData = {
  citySlug: 'rome',
  cc: 'IT',
  name: 'Rome Metro',
  status: 'operational',
  totalKm: 60.0,
  totalStations: 73,
  yearOpened: 1955,
  dailyRidership: 800_000,
  lines: [
    { name: 'Line A', color: '#F58220', stations: 27, km: 18.4, yearOpened: 1980 },
    { name: 'Line B', color: '#0055A4', stations: 26, km: 18.1, yearOpened: 1955 },
    { name: 'Line C', color: '#00953B', stations: 30, km: 25.6, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'termini', name: 'Termini', nameKa: 'termini', lat: 41.9009, lng: 12.5020, line: 'Line A / B', citySlug: 'rome', cc: 'IT', yearOpened: 1955, interchange: true },
    { slug: 'spagna', name: 'Spagna', nameKa: 'spagna', lat: 41.9068, lng: 12.4821, line: 'Line A', citySlug: 'rome', cc: 'IT', yearOpened: 1980, interchange: false },
    { slug: 'colosseo', name: 'Colosseo', nameKa: 'colosseo', lat: 41.8890, lng: 12.4964, line: 'Line B / C', citySlug: 'rome', cc: 'IT', yearOpened: 1955, interchange: true },
    { slug: 'barberini', name: 'Barberini', nameKa: 'barberini', lat: 41.9038, lng: 12.4883, line: 'Line A', citySlug: 'rome', cc: 'IT', yearOpened: 1980, interchange: false },
    { slug: 'ottaviano', name: 'Ottaviano', nameKa: 'ottaviano', lat: 41.9104, lng: 12.4585, line: 'Line A', citySlug: 'rome', cc: 'IT', yearOpened: 1980, interchange: false },
  ],
}

const milanMetro: MetroSystemData = {
  citySlug: 'milan',
  cc: 'IT',
  name: 'Milan Metro',
  status: 'operational',
  totalKm: 104.0,
  totalStations: 113,
  yearOpened: 1964,
  dailyRidership: 1_200_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 38, km: 27.0, yearOpened: 1964 },
    { name: 'Line 2', color: '#00953B', stations: 35, km: 40.0, yearOpened: 1969 },
    { name: 'Line 3', color: '#F5D122', stations: 21, km: 16.6, yearOpened: 1990 },
    { name: 'Line 4', color: '#00A1DE', stations: 21, km: 15.0, yearOpened: 2022 },
    { name: 'Line 5', color: '#7B5D37', stations: 19, km: 12.9, yearOpened: 2013 },
  ],
  stations: [
    { slug: 'duomo', name: 'Duomo', nameKa: 'duomo', lat: 45.4641, lng: 9.1919, line: 'Line 1 / 3', citySlug: 'milan', cc: 'IT', yearOpened: 1964, interchange: true },
    { slug: 'centrale', name: 'Centrale', nameKa: 'centrale', lat: 45.4847, lng: 9.2046, line: 'Line 2 / 3', citySlug: 'milan', cc: 'IT', yearOpened: 1969, interchange: true },
    { slug: 'garpibaldi', name: 'Garibaldi', nameKa: 'garibaldi', lat: 45.4833, lng: 9.1866, line: 'Line 2 / 5 / Passante', citySlug: 'milan', cc: 'IT', yearOpened: 1969, interchange: true },
    { slug: 'lodi', name: 'Lodi', nameKa: 'lodi', lat: 45.4508, lng: 9.2147, line: 'Line 1 / 4', citySlug: 'milan', cc: 'IT', yearOpened: 1990, interchange: true },
    { slug: 'romolo', name: 'Romolo', nameKa: 'romolo', lat: 45.4442, lng: 9.1897, line: 'Line 2', citySlug: 'milan', cc: 'IT', yearOpened: 1969, interchange: false },
  ],
}

const naplesMetro: MetroSystemData = {
  citySlug: 'naples',
  cc: 'IT',
  name: 'Naples Metro',
  status: 'operational',
  totalKm: 34.0,
  totalStations: 37,
  yearOpened: 1993,
  dailyRidership: 300_000,
  lines: [
    { name: 'Line 1', color: '#0055A4', stations: 19, km: 18.5, yearOpened: 1993 },
    { name: 'Line 2', color: '#E30613', stations: 12, km: 10.0, yearOpened: 2009 },
    { name: 'Line 6', color: '#F5D122', stations: 6, km: 5.5, yearOpened: 2007 },
  ],
  stations: [
    { slug: 'garibaldi-naples', name: 'Garibaldi', nameKa: 'garibaldi', lat: 40.8520, lng: 14.2742, line: 'Line 1 / 2', citySlug: 'naples', cc: 'IT', yearOpened: 1993, interchange: true },
    { slug: 'toledo', name: 'Toledo', nameKa: 'toledo', lat: 40.8450, lng: 14.2500, line: 'Line 1', citySlug: 'naples', cc: 'IT', yearOpened: 2011, interchange: false },
    { slug: 'dante', name: 'Dante', nameKa: 'dante', lat: 40.8480, lng: 14.2480, line: 'Line 1', citySlug: 'naples', cc: 'IT', yearOpened: 2002, interchange: false },
    { slug: 'municipio', name: 'Municipio', nameKa: 'municipio', lat: 40.8417, lng: 14.2520, line: 'Line 1', citySlug: 'naples', cc: 'IT', yearOpened: 1993, interchange: false },
  ],
}

const turinMetro: MetroSystemData = {
  citySlug: 'turin',
  cc: 'IT',
  name: 'Turin Metro',
  status: 'operational',
  totalKm: 15.0,
  totalStations: 21,
  yearOpened: 2006,
  dailyRidership: 150_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 21, km: 15.0, yearOpened: 2006 },
  ],
  stations: [
    { slug: 'porta-nuova', name: 'Porta Nuova', nameKa: 'porta-nuova', lat: 45.0683, lng: 7.6792, line: 'Line 1', citySlug: 'turin', cc: 'IT', yearOpened: 2006, interchange: true },
    { slug: 'porta-susa', name: 'Porta Susa', nameKa: 'porta-susa', lat: 45.0715, lng: 7.6693, line: 'Line 1', citySlug: 'turin', cc: 'IT', yearOpened: 2012, interchange: true },
    { slug: 'lingotto', name: 'Lingotto', nameKa: 'lingotto', lat: 45.0300, lng: 7.6658, line: 'Line 1', citySlug: 'turin', cc: 'IT', yearOpened: 2011, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — RUSSIA
// ────────────────────────────────────────────────────────────────

const moscowMetro: MetroSystemData = {
  citySlug: 'moscow',
  cc: 'RU',
  name: 'Moscow Metro',
  status: 'operational',
  totalKm: 443.0,
  totalStations: 263,
  yearOpened: 1935,
  dailyRidership: 6_800_000,
  lines: [
    { name: 'Line 1 (Sokolnicheskaya)', color: '#E30613', stations: 27, km: 26.4, yearOpened: 1935 },
    { name: 'Line 2 (Zamoskvoretskaya)', color: '#00953B', stations: 24, km: 33.8, yearOpened: 1938 },
    { name: 'Line 3 (Arbatsko-Pokrovskaya)', color: '#003DA5', stations: 22, km: 39.0, yearOpened: 1935 },
    { name: 'Line 4 (Filyovskaya)', color: '#00A1DE', stations: 13, km: 14.9, yearOpened: 1958 },
    { name: 'Line 5 (Koltsevaya)', color: '#7B5D37', stations: 12, km: 19.4, yearOpened: 1950 },
    { name: 'Line 6 (Kaluzhsko-Rizhskaya)', color: '#C86A2C', stations: 24, km: 37.9, yearOpened: 1958 },
    { name: 'Line 7 (Tagansko-Krasnopresnenskaya)', color: '#9B26B6', stations: 23, km: 36.4, yearOpened: 1966 },
    { name: 'Line 8 (Kalininskaya)', color: '#F5D122', stations: 14, km: 16.3, yearOpened: 1979 },
    { name: 'Line 9 (Serpukhovsko-Timiryazevskaya)', color: '#999999', stations: 25, km: 41.8, yearOpened: 1983 },
    { name: 'Line 10 (Lyublinsko-Dmitrovskaya)', color: '#00953B', stations: 28, km: 44.0, yearOpened: 1995 },
    { name: 'Line 11 (Kakhovskaya)', color: '#7B5D37', stations: 3, km: 3.4, yearOpened: 1995 },
    { name: 'Line 12 (Butovskaya)', color: '#00A1DE', stations: 7, km: 8.8, yearOpened: 2003 },
    { name: 'Line 14 (Moscow Central Circle)', color: '#C86A2C', stations: 31, km: 54.0, yearOpened: 2016 },
  ],
  stations: [
    { slug: 'komsomolskaya', name: 'Komsomolskaya', nameKa: 'komsomolskaya', lat: 55.7756, lng: 37.6539, line: 'Line 1 / 5 / Koltsevaya', citySlug: 'moscow', cc: 'RU', yearOpened: 1935, interchange: true },
    { slug: 'novokuznetskaya', name: 'Novokuznetskaya', nameKa: 'novokuznetskaya', lat: 55.7418, lng: 37.6299, line: 'Line 2 / 5 / 6', citySlug: 'moscow', cc: 'RU', yearOpened: 1943, interchange: true },
    { slug: 'ploshchad-revolyutsii', name: 'Ploshchad Revolyutsii', nameKa: 'ploshchad-revolyutsii', lat: 55.7575, lng: 37.6227, line: 'Line 3 / 5 / 4', citySlug: 'moscow', cc: 'RU', yearOpened: 1938, interchange: true },
    { slug: 'tsvetochnyy-bulvar', name: 'Tsvetnoy Bulvar', nameKa: 'tsvetochnyy-bulvar', lat: 55.7716, lng: 37.6212, line: 'Line 9', citySlug: 'moscow', cc: 'RU', yearOpened: 1988, interchange: false },
    { slug: 'kyivskaya', name: 'Kiyevskaya', nameKa: 'kiyevskaya', lat: 55.7443, lng: 37.5636, line: 'Line 3 / 4 / 5 / A', citySlug: 'moscow', cc: 'RU', yearOpened: 1937, interchange: true },
    { slug: 'aleksandrovsky-sad', name: 'Aleksandrovsky Sad', nameKa: 'aleksandrovsky-sad', lat: 55.7583, lng: 37.6095, line: 'Line 4 / 3 / 6 / 9', citySlug: 'moscow', cc: 'RU', yearOpened: 1935, interchange: true },
    { slug: 'belorusskaya', name: 'Belorusskaya', nameKa: 'belorusskaya', lat: 55.7743, lng: 37.5834, line: 'Line 2 / 5', citySlug: 'moscow', cc: 'RU', yearOpened: 1938, interchange: true },
    { slug: 'park-kultury', name: 'Park Kultury', nameKa: 'park-kultury', lat: 55.7333, lng: 37.5926, line: 'Line 5 / 6', citySlug: 'moscow', cc: 'RU', yearOpened: 1935, interchange: true },
    { slug: 'prospekt-mira', name: 'Prospekt Mira', nameKa: 'prospekt-mira', lat: 55.7866, lng: 37.6345, line: 'Line 6 / 5', citySlug: 'moscow', cc: 'RU', yearOpened: 1952, interchange: true },
    { slug: 'dubravnaya', name: 'Dubravnaya', nameKa: 'dubravnaya', lat: 55.7288, lng: 37.5980, line: 'Line 9 / 6', citySlug: 'moscow', cc: 'RU', yearOpened: 2000, interchange: true },
  ],
}

const stPetersburgMetro: MetroSystemData = {
  citySlug: 'st-petersburg',
  cc: 'RU',
  name: 'Saint Petersburg Metro',
  status: 'operational',
  totalKm: 138.0,
  totalStations: 72,
  yearOpened: 1955,
  dailyRidership: 2_100_000,
  lines: [
    { name: 'Line 1 (Kirovsko-Vyborgskaya)', color: '#E30613', stations: 19, km: 29.1, yearOpened: 1955 },
    { name: 'Line 2 (Moskovsko-Petrogradskaya)', color: '#00953B', stations: 18, km: 30.1, yearOpened: 1961 },
    { name: 'Line 3 (Nevsko-Vasileostrovskaya)', color: '#003DA5', stations: 22, km: 27.6, yearOpened: 1967 },
    { name: 'Line 4 (Pravoberezhnaya)', color: '#F5D122', stations: 8, km: 11.8, yearOpened: 1985 },
    { name: 'Line 5 (Frunzensko-Primorskaya)', color: '#C86A2C', stations: 14, km: 20.2, yearOpened: 1997 },
  ],
  stations: [
    { slug: 'avtovo', name: 'Avtovo', nameKa: 'avtovo', lat: 59.8610, lng: 30.2644, line: 'Line 1', citySlug: 'st-petersburg', cc: 'RU', yearOpened: 1955, interchange: false },
    { slug: 'mayakovskaya', name: 'Mayakovskaya', nameKa: 'mayakovskaya', lat: 59.9322, lng: 30.3510, line: 'Line 3', citySlug: 'st-petersburg', cc: 'RU', yearOpened: 1967, interchange: false },
    { slug: 'nec Nevsky', name: 'Nevsky Prospekt', nameKa: 'nevsky-prospekt', lat: 59.9354, lng: 30.3262, line: 'Line 2 / 5', citySlug: 'st-petersburg', cc: 'RU', yearOpened: 1963, interchange: true },
    { slug: 'gostiny-dvor', name: 'Gostiny Dvor', nameKa: 'gostiny-dvor', lat: 59.9351, lng: 30.3273, line: 'Line 5', citySlug: 'st-petersburg', cc: 'RU', yearOpened: 1997, interchange: false },
    { slug: 'sportivnaya', name: 'Sportivnaya', nameKa: 'sportivnaya', lat: 59.9531, lng: 30.2908, line: 'Line 5', citySlug: 'st-petersburg', cc: 'RU', yearOpened: 1997, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// EUROPE — OTHER
// ────────────────────────────────────────────────────────────────

const viennaMetro: MetroSystemData = {
  citySlug: 'vienna',
  cc: 'AT',
  name: 'Vienna U-Bahn',
  status: 'operational',
  totalKm: 83.0,
  totalStations: 108,
  yearOpened: 1978,
  dailyRidership: 1_200_000,
  lines: [
    { name: 'U1', color: '#E30613', stations: 24, km: 19.1, yearOpened: 1978 },
    { name: 'U2', color: '#E74E39', stations: 20, km: 16.8, yearOpened: 1980 },
    { name: 'U3', color: '#00953B', stations: 20, km: 13.5, yearOpened: 1991 },
    { name: 'U4', color: '#7B5D37', stations: 20, km: 16.4, yearOpened: 1976 },
    { name: 'U6', color: '#9B26B6', stations: 24, km: 17.4, yearOpened: 1989 },
  ],
  stations: [
    { slug: 'stephansplatz', name: 'Stephansplatz', nameKa: 'stephansplatz', lat: 48.2084, lng: 16.3731, line: 'U1 / U3', citySlug: 'vienna', cc: 'AT', yearOpened: 1978, interchange: true },
    { slug: 'karlsplatz', name: 'Karlsplatz', nameKa: 'karlsplatz', lat: 48.2034, lng: 16.3686, line: 'U1 / U2 / U4', citySlug: 'vienna', cc: 'AT', yearOpened: 1978, interchange: true },
    { slug: 'wien-mitte', name: 'Wien Mitte', nameKa: 'wien-mitte', lat: 48.2093, lng: 16.3859, line: 'U3 / S-Bahn', citySlug: 'vienna', cc: 'AT', yearOpened: 1991, interchange: true },
    { slug: 'praterstern', name: 'Praterstern', nameKa: 'praterstern', lat: 48.2191, lng: 16.3917, line: 'U1 / S-Bahn', citySlug: 'vienna', cc: 'AT', yearOpened: 2006, interchange: true },
    { slug: 'westbahnhof', name: 'Westbahnhof', nameKa: 'westbahnhof', lat: 48.1861, lng: 16.3384, line: 'U3 / U6', citySlug: 'vienna', cc: 'AT', yearOpened: 1978, interchange: true },
    { slug: 'hbf-wien', name: 'Wien Hauptbahnhof', nameKa: 'wien-hbf', lat: 48.1854, lng: 16.3751, line: 'U1 / S-Bahn / ICE', citySlug: 'vienna', cc: 'AT', yearOpened: 1978, interchange: true },
  ],
}

const pragueMetro: MetroSystemData = {
  citySlug: 'prague',
  cc: 'CZ',
  name: 'Prague Metro',
  status: 'operational',
  totalKm: 59.0,
  totalStations: 61,
  yearOpened: 1974,
  dailyRidership: 1_200_000,
  lines: [
    { name: 'Line A', color: '#00953B', stations: 17, km: 17.1, yearOpened: 1978 },
    { name: 'Line B', color: '#F5D122', stations: 24, km: 22.7, yearOpened: 1985 },
    { name: 'Line C', color: '#E30613', stations: 20, km: 19.1, yearOpened: 1980 },
  ],
  stations: [
    { slug: 'muzeum', name: 'Muzeum', nameKa: 'muzeum', lat: 50.0814, lng: 14.4323, line: 'Line A / C', citySlug: 'prague', cc: 'CZ', yearOpened: 1978, interchange: true },
    { slug: 'mustek', name: 'Mustek', nameKa: 'mustek', lat: 50.0833, lng: 14.4219, line: 'Line A / B', citySlug: 'prague', cc: 'CZ', yearOpened: 1985, interchange: true },
    { slug: 'florenc', name: 'Florenc', nameKa: 'florenc', lat: 50.0900, lng: 14.4390, line: 'Line B / C', citySlug: 'prague', cc: 'CZ', yearOpened: 1985, interchange: true },
    { slug: 'praha-hl.n.', name: 'Praha hl.n.', nameKa: 'praha-hl-n', lat: 50.0828, lng: 14.4367, line: 'Line C', citySlug: 'prague', cc: 'CZ', yearOpened: 1980, interchange: true },
  ],
}

const warsawMetro: MetroSystemData = {
  citySlug: 'warsaw',
  cc: 'PL',
  name: 'Warsaw Metro',
  status: 'operational',
  totalKm: 42.0,
  totalStations: 38,
  yearOpened: 1995,
  dailyRidership: 400_000,
  lines: [
    { name: 'Line M1', color: '#E30613', stations: 21, km: 23.0, yearOpened: 1995 },
    { name: 'Line M2', color: '#00953B', stations: 17, km: 19.0, yearOpened: 2015 },
  ],
  stations: [
    { slug: 'swietokrzyska', name: 'Swietokrzyska', nameKa: 'swietokrzyska', lat: 52.2292, lng: 21.0119, line: 'Line M1 / M2', citySlug: 'warsaw', cc: 'PL', yearOpened: 2001, interchange: true },
    { slug: 'dworz-gdanski', name: 'Dworzec Gdanski', nameKa: 'dworzec-gdanski', lat: 52.2586, lng: 20.9875, line: 'Line M1', citySlug: 'warsaw', cc: 'PL', yearOpened: 1995, interchange: false },
    { slug: 'centrum', name: 'Centrum', nameKa: 'centrum', lat: 52.2284, lng: 21.0033, line: 'Line M1', citySlug: 'warsaw', cc: 'PL', yearOpened: 1995, interchange: false },
    { slug: 'wilanowska', name: 'Wilanowska', nameKa: 'wilanowska', lat: 52.1797, lng: 21.0763, line: 'Line M1', citySlug: 'warsaw', cc: 'PL', yearOpened: 1995, interchange: false },
  ],
}

const budapestMetro: MetroSystemData = {
  citySlug: 'budapest',
  cc: 'HU',
  name: 'Budapest Metro',
  status: 'operational',
  totalKm: 41.0,
  totalStations: 48,
  yearOpened: 1896,
  dailyRidership: 800_000,
  lines: [
    { name: 'Line M1 (Millennium)', color: '#F5D122', stations: 11, km: 4.4, yearOpened: 1896 },
    { name: 'Line M2', color: '#E30613', stations: 11, km: 10.3, yearOpened: 1970 },
    { name: 'Line M3', color: '#00953B', stations: 20, km: 17.3, yearOpened: 1976 },
    { name: 'Line M4', color: '#00A1DE', stations: 10, km: 7.4, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'deak-ferenc-ter', name: 'Deak Ferenc Ter', nameKa: 'deak-ferenc-ter', lat: 47.4972, lng: 19.0559, line: 'M1 / M2 / M3', citySlug: 'budapest', cc: 'HU', yearOpened: 1896, interchange: true },
    { slug: 'vorosmarty-ter', name: 'Vorosmarty Ter', nameKa: 'vorosmarty-ter', lat: 47.4966, lng: 19.0496, line: 'M1', citySlug: 'budapest', cc: 'HU', yearOpened: 1896, interchange: false },
    { slug: 'blaha-lujza-ter', name: 'Blaha Lujza Ter', nameKa: 'blaha-lujza-ter', lat: 47.4935, lng: 19.0842, line: 'M2', citySlug: 'budapest', cc: 'HU', yearOpened: 1970, interchange: false },
    { slug: 'fot', name: 'Fot', nameKa: 'fot', lat: 47.5037, lng: 19.0585, line: 'M1', citySlug: 'budapest', cc: 'HU', yearOpened: 1896, interchange: false },
  ],
}

const bucharestMetro: MetroSystemData = {
  citySlug: 'bucharest',
  cc: 'RO',
  name: 'Bucharest Metro',
  status: 'operational',
  totalKm: 75.0,
  totalStations: 64,
  yearOpened: 1979,
  dailyRidership: 700_000,
  lines: [
    { name: 'Line M1', color: '#E30613', stations: 22, km: 16.1, yearOpened: 1979 },
    { name: 'Line M2', color: '#00953B', stations: 14, km: 18.7, yearOpened: 1986 },
    { name: 'Line M3', color: '#0055A4', stations: 18, km: 22.1, yearOpened: 1983 },
    { name: 'Line M4', color: '#F5D122', stations: 8, km: 5.0, yearOpened: 2000 },
    { name: 'Line M5', color: '#C86A2C', stations: 10, km: 10.0, yearOpened: 2020 },
  ],
  stations: [
    { slug: 'universitate', name: 'Universitate', nameKa: 'universitate', lat: 44.4396, lng: 26.1012, line: 'M2', citySlug: 'bucharest', cc: 'RO', yearOpened: 1986, interchange: false },
    { slug: 'piata-romana', name: 'Piata Romana', nameKa: 'piata-romana', lat: 44.4503, lng: 26.0862, line: 'M2', citySlug: 'bucharest', cc: 'RO', yearOpened: 1986, interchange: false },
    { slug: 'piata-victoriei', name: 'Piata Victoriei', nameKa: 'piata-victoriei', lat: 44.4532, lng: 26.0790, line: 'M1 / M2', citySlug: 'bucharest', cc: 'RO', yearOpened: 1986, interchange: true },
    { slug: 'obor', name: 'Obor', nameKa: 'obor', lat: 44.4406, lng: 26.1333, line: 'M1', citySlug: 'bucharest', cc: 'RO', yearOpened: 1979, interchange: false },
  ],
}

const athensMetro: MetroSystemData = {
  citySlug: 'athens',
  cc: 'GR',
  name: 'Athens Metro',
  status: 'operational',
  totalKm: 91.0,
  totalStations: 85,
  yearOpened: 2000,
  dailyRidership: 1_300_000,
  lines: [
    { name: 'Line 1 (ISAP)', color: '#00953B', stations: 24, km: 25.6, yearOpened: 1869 },
    { name: 'Line 2', color: '#E30613', stations: 20, km: 18.0, yearOpened: 2000 },
    { name: 'Line 3', color: '#003DA5', stations: 34, km: 41.0, yearOpened: 2000 },
  ],
  stations: [
    { slug: 'syntagma', name: 'Syntagma', nameKa: 'syntagma', lat: 37.9751, lng: 23.7348, line: 'Line 2 / 3', citySlug: 'athens', cc: 'GR', yearOpened: 2000, interchange: true },
    { slug: 'monastiraki', name: 'Monastiraki', nameKa: 'monastiraki', lat: 37.9751, lng: 23.7249, line: 'Line 1 / 3', citySlug: 'athens', cc: 'GR', yearOpened: 2000, interchange: true },
    { slug: 'atheniki', name: 'Atheniki', nameKa: 'atheniki', lat: 37.9767, lng: 23.7314, line: 'Line 3', citySlug: 'athens', cc: 'GR', yearOpened: 2003, interchange: false },
    { slug: 'agios-dimitrios', name: 'Agios Dimitrios', nameKa: 'agios-dimitrios', lat: 37.9356, lng: 23.7265, line: 'Line 1', citySlug: 'athens', cc: 'GR', yearOpened: 2000, interchange: false },
    { slug: 'pireaus', name: 'Pireaus', nameKa: 'pireaus', lat: 37.9466, lng: 23.6424, line: 'Line 1', citySlug: 'athens', cc: 'GR', yearOpened: 1869, interchange: true },
  ],
}

const lisbonMetro: MetroSystemData = {
  citySlug: 'lisbon',
  cc: 'PT',
  name: 'Lisbon Metro',
  status: 'operational',
  totalKm: 36.0,
  totalStations: 56,
  yearOpened: 1959,
  dailyRidership: 550_000,
  lines: [
    { name: 'Blue Line', color: '#0055A4', stations: 18, km: 14.0, yearOpened: 1959 },
    { name: 'Yellow Line', color: '#F5D122', stations: 13, km: 11.0, yearOpened: 1988 },
    { name: 'Green Line', color: '#00953B', stations: 13, km: 9.0, yearOpened: 1993 },
    { name: 'Red Line', color: '#E30613', stations: 12, km: 13.0, yearOpened: 2002 },
  ],
  stations: [
    { slug: 'marques-pombal', name: 'Marques de Pombal', nameKa: 'marques-pombal', lat: 38.7255, lng: -9.1519, line: 'Blue / Yellow', citySlug: 'lisbon', cc: 'PT', yearOpened: 1959, interchange: true },
    { slug: 'baixa-chiado', name: 'Baixa-Chiado', nameKa: 'baixa-chiado', lat: 38.7108, lng: -9.1399, line: 'Green / Blue', citySlug: 'lisbon', cc: 'PT', yearOpened: 1998, interchange: true },
    { slug: 'alameda', name: 'Alameda', nameKa: 'alameda', lat: 38.7365, lng: -9.1356, line: 'Green / Red', citySlug: 'lisbon', cc: 'PT', yearOpened: 1993, interchange: true },
    { slug: 'rio-seco', name: 'Rio de Mouro', nameKa: 'rio-de-mouro', lat: 38.7971, lng: -9.2491, line: 'Yellow', citySlug: 'lisbon', cc: 'PT', yearOpened: 1997, interchange: false },
  ],
}

const portoMetro: MetroSystemData = {
  citySlug: 'porto',
  cc: 'PT',
  name: 'Porto Metro',
  status: 'operational',
  totalKm: 70.0,
  totalStations: 82,
  yearOpened: 2002,
  dailyRidership: 200_000,
  lines: [
    { name: 'Line A', color: '#00953B', stations: 20, km: 15.0, yearOpened: 2002 },
    { name: 'Line B', color: '#E30613', stations: 22, km: 16.0, yearOpened: 2002 },
    { name: 'Line C', color: '#0055A4', stations: 20, km: 15.0, yearOpened: 2005 },
    { name: 'Line D', color: '#F5D122', stations: 20, km: 15.0, yearOpened: 2005 },
    { name: 'Line E', color: '#9B26B6', stations: 22, km: 16.0, yearOpened: 2006 },
    { name: 'Line F', color: '#7B5D37', stations: 20, km: 15.0, yearOpened: 2011 },
    { name: 'Line G', color: '#C86A2C', stations: 6, km: 3.0, yearOpened: 2011 },
  ],
  stations: [
    { slug: 'trindade', name: 'Trindade', nameKa: 'trindade', lat: 41.1525, lng: -8.6106, line: 'Lines A-F', citySlug: 'porto', cc: 'PT', yearOpened: 2002, interchange: true },
    { slug: 'bateria', name: 'Batalha', nameKa: 'batalha', lat: 41.1437, lng: -8.6087, line: 'Line A', citySlug: 'porto', cc: 'PT', yearOpened: 2002, interchange: false },
    { slug: 'porta-nova', name: 'Porta Nova', nameKa: 'porta-nova', lat: 41.1611, lng: -8.6203, line: 'Line A / B', citySlug: 'porto', cc: 'PT', yearOpened: 2002, interchange: true },
  ],
}

const dublinLuas: MetroSystemData = {
  citySlug: 'dublin',
  cc: 'IE',
  name: 'Dublin Luas / DART',
  status: 'operational',
  totalKm: 65.0,
  totalStations: 67,
  yearOpened: 2004,
  dailyRidership: 400_000,
  lines: [
    { name: 'Luas Green Line', color: '#00953B', stations: 33, km: 24.5, yearOpened: 2004 },
    { name: 'Luas Red Line', color: '#E30613', stations: 34, km: 19.0, yearOpened: 2004 },
    { name: 'DART', color: '#0055A4', stations: 31, km: 53.0, yearOpened: 1984 },
  ],
  stations: [
    { slug: 'connolly', name: 'Connolly', nameKa: 'connolly', lat: 53.3511, lng: -6.2494, line: 'Red / DART', citySlug: 'dublin', cc: 'IE', yearOpened: 2004, interchange: true },
    { slug: 'abbey-street', name: 'Abbey Street', nameKa: 'abbey-street', lat: 53.3492, lng: -6.2617, line: 'Red', citySlug: 'dublin', cc: 'IE', yearOpened: 2004, interchange: false },
    { slug: 'st-stephen-green', name: 'St Stephens Green', nameKa: 'st-stephens-green', lat: 53.3390, lng: -6.2544, line: 'Green', citySlug: 'dublin', cc: 'IE', yearOpened: 2004, interchange: false },
    { slug: 'heuston', name: 'Heuston', nameKa: 'heuston', lat: 53.3465, lng: -6.2982, line: 'Red', citySlug: 'dublin', cc: 'IE', yearOpened: 2004, interchange: true },
  ],
}

const stockholmMetro: MetroSystemData = {
  citySlug: 'stockholm',
  cc: 'SE',
  name: 'Stockholm Metro (Tunnelbana)',
  status: 'operational',
  totalKm: 112.0,
  totalStations: 100,
  yearOpened: 1950,
  dailyRidership: 800_000,
  lines: [
    { name: 'Line 10', color: '#00953B', stations: 20, km: 19.5, yearOpened: 1952 },
    { name: 'Line 11', color: '#00953B', stations: 17, km: 17.8, yearOpened: 1954 },
    { name: 'Line 13', color: '#E30613', stations: 25, km: 23.6, yearOpened: 1964 },
    { name: 'Line 14', color: '#E30613', stations: 19, km: 18.4, yearOpened: 1964 },
    { name: 'Line 17', color: '#F5D122', stations: 24, km: 19.6, yearOpened: 1958 },
    { name: 'Line 18', color: '#F5D122', stations: 23, km: 19.2, yearOpened: 1958 },
    { name: 'Line 19', color: '#0055A4', stations: 22, km: 19.5, yearOpened: 1962 },
  ],
  stations: [
    { slug: 't-centralen', name: 'T-Centralen', nameKa: 't-centralen', lat: 59.3326, lng: 18.0644, line: 'All Lines', citySlug: 'stockholm', cc: 'SE', yearOpened: 1950, interchange: true },
    { slug: 'kungstradgarden', name: 'Kungstradgarden', nameKa: 'kungstradgarden', lat: 59.3311, lng: 18.0735, line: 'Line 10 / 11', citySlug: 'stockholm', cc: 'SE', yearOpened: 1977, interchange: false },
    { slug: 'st-eoplan', name: 'St Eoplan', nameKa: 'st-eoplan', lat: 59.3484, lng: 18.0813, line: 'Line 13 / 14 / 17 / 18 / 19', citySlug: 'stockholm', cc: 'SE', yearOpened: 1950, interchange: true },
    { slug: 'slussen', name: 'Slussen', nameKa: 'slussen', lat: 59.3207, lng: 18.0724, line: 'Line 13 / 14 / 17 / 18 / 19', citySlug: 'stockholm', cc: 'SE', yearOpened: 1950, interchange: true },
  ],
}

const copenhagenMetro: MetroSystemData = {
  citySlug: 'copenhagen',
  cc: 'DK',
  name: 'Copenhagen Metro / S-tog',
  status: 'operational',
  totalKm: 103.0,
  totalStations: 85,
  yearOpened: 2002,
  dailyRidership: 700_000,
  lines: [
    { name: 'M1', color: '#00953B', stations: 22, km: 16.5, yearOpened: 2002 },
    { name: 'M2', color: '#F5D122', stations: 22, km: 16.5, yearOpened: 2002 },
    { name: 'M3 (Cityringen)', color: '#E30613', stations: 24, km: 15.5, yearOpened: 2019 },
    { name: 'M4 (Nordhavn)', color: '#0055A4', stations: 11, km: 9.0, yearOpened: 2020 },
    { name: 'S-tog (7 lines)', color: '#999999', stations: 85, km: 93.0, yearOpened: 1934 },
  ],
  stations: [
    { slug: 'koebenhavn-h', name: 'Koebenhavn H', nameKa: 'koebenhavn-h', lat: 55.6727, lng: 12.5649, line: 'M1 / M2 / M3 / S-tog', citySlug: 'copenhagen', cc: 'DK', yearOpened: 1934, interchange: true },
    { slug: 'noerreport', name: 'Noerreport', nameKa: 'noerreport', lat: 55.6802, lng: 12.5732, line: 'M1 / M2 / S-tog', citySlug: 'copenhagen', cc: 'DK', yearOpened: 1918, interchange: true },
    { slug: 'fredriksberg', name: 'Frederiksberg', nameKa: 'frederiksberg', lat: 55.6801, lng: 12.5340, line: 'M1 / M2', citySlug: 'copenhagen', cc: 'DK', yearOpened: 2003, interchange: false },
    { slug: 'norreport', name: 'Norreport', nameKa: 'norreport', lat: 55.6802, lng: 12.5732, line: 'M1 / M2 / S-tog', citySlug: 'copenhagen', cc: 'DK', yearOpened: 1918, interchange: true },
    { slug: 'christianshavn', name: 'Christianshavn', nameKa: 'christianshavn', lat: 55.6720, lng: 12.5935, line: 'M1 / M2', citySlug: 'copenhagen', cc: 'DK', yearOpened: 2002, interchange: false },
  ],
}

const osloMetro: MetroSystemData = {
  citySlug: 'oslo',
  cc: 'NO',
  name: 'Oslo Metro / T-bane',
  status: 'operational',
  totalKm: 85.0,
  totalStations: 97,
  yearOpened: 1897,
  dailyRidership: 350_000,
  lines: [
    { name: 'Line 1', color: '#E30613', stations: 32, km: 18.0, yearOpened: 1966 },
    { name: 'Line 2', color: '#00953B', stations: 22, km: 14.0, yearOpened: 1966 },
    { name: 'Line 3', color: '#0055A4', stations: 20, km: 12.0, yearOpened: 1966 },
    { name: 'Line 4', color: '#F5D122', stations: 20, km: 11.0, yearOpened: 1966 },
    { name: 'Line 5', color: '#7B5D37', stations: 17, km: 10.0, yearOpened: 1997 },
  ],
  stations: [
    { slug: 'stortinget', name: 'Stortinget', nameKa: 'stortinget', lat: 59.9130, lng: 10.7358, line: 'All Lines', citySlug: 'oslo', cc: 'NO', yearOpened: 1966, interchange: true },
    { slug: 'jernbanetorget', name: 'Jernbanetorget', nameKa: 'jernbanetorget', lat: 59.9110, lng: 10.7510, line: 'All Lines', citySlug: 'oslo', cc: 'NO', yearOpened: 1966, interchange: true },
    { slug: 'gronland', name: 'Grönland', nameKa: 'gronland', lat: 59.9109, lng: 10.7645, line: 'All Lines', citySlug: 'oslo', cc: 'NO', yearOpened: 1966, interchange: false },
    { slug: 'veitvet', name: 'Veitvet', nameKa: 'veitvet', lat: 59.9320, lng: 10.7993, line: 'Line 4 / 5', citySlug: 'oslo', cc: 'NO', yearOpened: 1966, interchange: false },
  ],
}

const helsinkiMetro: MetroSystemData = {
  citySlug: 'helsinki',
  cc: 'FI',
  name: 'Helsinki Metro',
  status: 'operational',
  totalKm: 43.0,
  totalStations: 40,
  yearOpened: 1982,
  dailyRidership: 350_000,
  lines: [
    { name: 'M1 (Matinkyla)', color: '#E30613', stations: 25, km: 23.0, yearOpened: 1982 },
    { name: 'M2 (Mellunmaki)', color: '#00953B', stations: 22, km: 20.0, yearOpened: 1982 },
  ],
  stations: [
    { slug: 'helsingin-yliopisto', name: 'Helsingin Yliopisto', nameKa: 'helsingin-yliopisto', lat: 60.1707, lng: 24.9371, line: 'M1 / M2', citySlug: 'helsinki', cc: 'FI', yearOpened: 1982, interchange: true },
    { slug: 'rautatientori', name: 'Rautatientori', nameKa: 'rautatientori', lat: 60.1713, lng: 24.9426, line: 'M1 / M2', citySlug: 'helsinki', cc: 'FI', yearOpened: 1982, interchange: true },
    { slug: 'kauppatori', name: 'Kauppatori', nameKa: 'kauppatori', lat: 60.1680, lng: 24.9517, line: 'M1 / M2', citySlug: 'helsinki', cc: 'FI', yearOpened: 1982, interchange: false },
    { slug: 'kamppi', name: 'Kamppi', nameKa: 'kamppi', lat: 60.1687, lng: 24.9279, line: 'M1 / M2', citySlug: 'helsinki', cc: 'FI', yearOpened: 1984, interchange: false },
  ],
}

const zurichSbahn: MetroSystemData = {
  citySlug: 'zurich',
  cc: 'CH',
  name: 'Zurich S-Bahn / Tram',
  status: 'operational',
  totalKm: 90.0,
  totalStations: 48,
  yearOpened: 1990,
  dailyRidership: 500_000,
  lines: [
    { name: 'S-Bahn (10 lines)', color: '#00953B', stations: 48, km: 90.0, yearOpened: 1990 },
    { name: 'Tram (15 lines)', color: '#E30613', stations: 150, km: 72.0, yearOpened: 1882 },
  ],
  stations: [
    { slug: 'zurich-hb', name: 'Zurich HB', nameKa: 'zurich-hb', lat: 47.3783, lng: 8.5403, line: 'All S-Bahn / Tram', citySlug: 'zurich', cc: 'CH', yearOpened: 1990, interchange: true },
    { slug: 'stadelhofen', name: 'Stadelhofen', nameKa: 'stadelhofen', lat: 47.3660, lng: 8.5485, line: 'S-Bahn', citySlug: 'zurich', cc: 'CH', yearOpened: 1990, interchange: true },
    { slug: 'buerkliplatz', name: 'Burkliplatz', nameKa: 'burkliplatz', lat: 47.3647, lng: 8.5407, line: 'Tram', citySlug: 'zurich', cc: 'CH', yearOpened: 1882, interchange: false },
  ],
}

const genevaMetro: MetroSystemData = {
  citySlug: 'geneva',
  cc: 'CH',
  name: 'Geneva Metro / Tram',
  status: 'operational',
  totalKm: 16.0,
  totalStations: 17,
  yearOpened: 1984,
  dailyRidership: 250_000,
  lines: [
    { name: 'Line 10', color: '#E30613', stations: 14, km: 8.0, yearOpened: 1984 },
    { name: 'Line 15', color: '#0055A4', stations: 12, km: 7.0, yearOpened: 2003 },
    { name: 'Line 18', color: '#00953B', stations: 10, km: 5.0, yearOpened: 2011 },
  ],
  stations: [
    { slug: 'cornavin', name: 'Cornavin', nameKa: 'cornavin', lat: 46.2087, lng: 6.1418, line: 'Line 10 / 15 / 18', citySlug: 'geneva', cc: 'CH', yearOpened: 1984, interchange: true },
    { slug: 'bel-air', name: 'Bel-Air', nameKa: 'bel-air', lat: 46.2048, lng: 6.1495, line: 'Line 10', citySlug: 'geneva', cc: 'CH', yearOpened: 1984, interchange: false },
  ],
}

const baselMetro: MetroSystemData = {
  citySlug: 'basel',
  cc: 'CH',
  name: 'Basel Tram / S-Bahn',
  status: 'operational',
  totalKm: 35.0,
  totalStations: 30,
  yearOpened: 1895,
  dailyRidership: 150_000,
  lines: [
    { name: 'Tram (13 lines)', color: '#E30613', stations: 30, km: 35.0, yearOpened: 1895 },
    { name: 'S-Bahn (5 lines)', color: '#0055A4', stations: 20, km: 45.0, yearOpened: 1855 },
  ],
  stations: [
    { slug: 'basel-sbb', name: 'Basel SBB', nameKa: 'basel-sbb', lat: 47.5472, lng: 7.5892, line: 'All Tram / S-Bahn', citySlug: 'basel', cc: 'CH', yearOpened: 1855, interchange: true },
  ],
}

const lausanneMetro: MetroSystemData = {
  citySlug: 'lausanne',
  cc: 'CH',
  name: 'Lausanne Metro',
  status: 'operational',
  totalKm: 14.0,
  totalStations: 28,
  yearOpened: 1988,
  dailyRidership: 100_000,
  lines: [
    { name: 'Line M1', color: '#E30613', stations: 14, km: 6.0, yearOpened: 1988 },
    { name: 'Line M2', color: '#00953B', stations: 14, km: 8.0, yearOpened: 2008 },
  ],
  stations: [
    { slug: 'lausanne-flon', name: 'Lausanne-Flon', nameKa: 'lausanne-flon', lat: 46.5207, lng: 6.6368, line: 'Line M1 / M2', citySlug: 'lausanne', cc: 'CH', yearOpened: 1988, interchange: true },
    { slug: 'riponne', name: 'Riponne', nameKa: 'riponne', lat: 46.5222, lng: 6.6382, line: 'Line M2', citySlug: 'lausanne', cc: 'CH', yearOpened: 2008, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// AMERICAS — NORTH AMERICA
// ────────────────────────────────────────────────────────────────

const nycSubway: MetroSystemData = {
  citySlug: 'new-york',
  cc: 'US',
  name: 'New York City Subway',
  status: 'operational',
  totalKm: 394.0,
  totalStations: 472,
  yearOpened: 1904,
  dailyRidership: 3_500_000,
  lines: [
    { name: 'A (Eighth Avenue Express)', color: '#0039A6', stations: 22, km: 51.0, yearOpened: 1931 },
    { name: 'B (Sixth Avenue Express)', color: '#FF6319', stations: 22, km: 38.0, yearOpened: 1940 },
    { name: 'C (Eighth Avenue Local)', color: '#0039A6', stations: 40, km: 43.0, yearOpened: 1931 },
    { name: 'D (Sixth Avenue Express)', color: '#FF6319', stations: 36, km: 42.0, yearOpened: 1940 },
    { name: 'E (Eighth Avenue Local)', color: '#0039A6', stations: 30, km: 34.0, yearOpened: 1933 },
    { name: 'F (Sixth Avenue Local)', color: '#FF6319', stations: 45, km: 43.0, yearOpened: 1933 },
    { name: 'G (Brooklyn-Queens Crosstown)', color: '#6CBE45', stations: 21, km: 19.0, yearOpened: 1933 },
    { name: 'J (Nassau Street Express)', color: '#996633', stations: 30, km: 23.0, yearOpened: 1908 },
    { name: 'L (14th Street Crosstown)', color: '#A7A9AC', stations: 24, km: 13.0, yearOpened: 1928 },
    { name: 'M (Sixth Avenue Local)', color: '#FF6319', stations: 34, km: 27.0, yearOpened: 1924 },
    { name: 'N (Broadway Express)', color: '#FCCC0A', stations: 25, km: 26.0, yearOpened: 1917 },
    { name: 'Q (Broadway Express)', color: '#FCCC0A', stations: 23, km: 24.0, yearOpened: 1920 },
    { name: 'R (Broadway Local)', color: '#FCCC0A', stations: 45, km: 33.0, yearOpened: 1920 },
    { name: 'S (42nd Street Shuttle)', color: '#808183', stations: 3, km: 0.8, yearOpened: 1904 },
    { name: 'W (Broadway Local)', color: '#FCCC0A', stations: 25, km: 20.0, yearOpened: 2010 },
    { name: 'Z (Nassau Street Express)', color: '#996633', stations: 18, km: 16.0, yearOpened: 1908 },
    { name: '1 (Seventh Avenue Express)', color: '#EE352E', stations: 38, km: 33.0, yearOpened: 1904 },
    { name: '2 (Seventh Avenue Express)', color: '#EE352E', stations: 43, km: 40.0, yearOpened: 1905 },
    { name: '3 (Seventh Avenue Express)', color: '#EE352E', stations: 34, km: 33.0, yearOpened: 1905 },
    { name: '4 (Lexington Avenue Express)', color: '#00933C', stations: 54, km: 40.0, yearOpened: 1917 },
    { name: '5 (Lexington Avenue Express)', color: '#00933C', stations: 39, km: 34.0, yearOpened: 1918 },
    { name: '6 (Lexington Avenue Local)', color: '#00933C', stations: 38, km: 28.0, yearOpened: 1918 },
    { name: '7 (Flushing Express)', color: '#B933AD', stations: 20, km: 18.0, yearOpened: 1914 },
    { name: 'S (Franklin Avenue Shuttle)', color: '#808183', stations: 4, km: 2.3, yearOpened: 1899 },
    { name: 'S (Rockaway Park Shuttle)', color: '#808183', stations: 5, km: 4.5, yearOpened: 1958 },
  ],
  stations: [
    { slug: 'times-sq', name: 'Times Square-42nd St', nameKa: 'times-sq', lat: 40.7580, lng: -73.9855, line: '1/2/3/7/N/Q/R/W/S', citySlug: 'new-york', cc: 'US', yearOpened: 1904, interchange: true },
    { slug: 'grand-central', name: 'Grand Central-42nd St', nameKa: 'grand-central', lat: 40.7527, lng: -73.9772, line: '4/5/6/7/S', citySlug: 'new-york', cc: 'US', yearOpened: 1904, interchange: true },
    { slug: '34th-st-herald-sq', name: '34th St-Herald Square', nameKa: '34th-st-herald-sq', lat: 40.7484, lng: -73.9878, line: 'B/D/F/M/N/Q/R/W', citySlug: 'new-york', cc: 'US', yearOpened: 1924, interchange: true },
    { slug: '14th-st-union-sq', name: '14th St-Union Square', nameKa: '14th-st-union-sq', lat: 40.7357, lng: -73.9899, line: '4/5/6/L/N/Q/R/W', citySlug: 'new-york', cc: 'US', yearOpened: 1904, interchange: true },
    { slug: 'atlantic-ave', name: 'Atlantic Ave-Barclays Ctr', nameKa: 'atlantic-ave', lat: 40.6842, lng: -73.9780, line: '2/3/4/5/B/D/N/Q/R', citySlug: 'new-york', cc: 'US', yearOpened: 1904, interchange: true },
    { slug: 'fulton-st', name: 'Fulton Street', nameKa: 'fulton-st', lat: 40.7100, lng: -74.0076, line: '2/3/4/5/A/C/J/Z', citySlug: 'new-york', cc: 'US', yearOpened: 1933, interchange: true },
    { slug: 'penn-station', name: 'Penn Station-34th St', nameKa: 'penn-station', lat: 40.7505, lng: -73.9935, line: '1/2/3/A/C/E', citySlug: 'new-york', cc: 'US', yearOpened: 1904, interchange: true },
    { slug: 'columbus-circle', name: 'Columbus Circle-59th St', nameKa: 'columbus-circle', lat: 40.7681, lng: -73.9819, line: '1/A/B/C/D', citySlug: 'new-york', cc: 'US', yearOpened: 1904, interchange: true },
    { slug: 'jfk-airport', name: 'JFK Airport', nameKa: 'jfk-airport', lat: 40.6454, lng: -73.7798, line: 'A/E/J/Z/LIRR', citySlug: 'new-york', cc: 'US', yearOpened: 1978, interchange: true },
    { slug: 'world-trade-center', name: 'World Trade Center', nameKa: 'world-trade-center', lat: 40.7127, lng: -74.0135, line: 'E', citySlug: 'new-york', cc: 'US', yearOpened: 2018, interchange: false },
  ],
}

const washingtonDC: MetroSystemData = {
  citySlug: 'washington-dc',
  cc: 'US',
  name: 'Washington DC Metro',
  status: 'operational',
  totalKm: 188.0,
  totalStations: 98,
  yearOpened: 1976,
  dailyRidership: 600_000,
  lines: [
    { name: 'Red Line', color: '#C8102E', stations: 27, km: 34.0, yearOpened: 1976 },
    { name: 'Orange Line', color: '#E57822', stations: 26, km: 42.0, yearOpened: 1986 },
    { name: 'Blue Line', color: '#0072BA', stations: 27, km: 39.0, yearOpened: 1977 },
    { name: 'Green Line', color: '#009B3A', stations: 21, km: 32.0, yearOpened: 1991 },
    { name: 'Yellow Line', color: '#FFD100', stations: 17, km: 16.0, yearOpened: 1983 },
    { name: 'Silver Line', color: '#A7A9AC', stations: 34, km: 47.0, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'metro-center', name: 'Metro Center', nameKa: 'metro-center', lat: 38.8983, lng: -77.0280, line: 'Red / Orange / Blue / Silver', citySlug: 'washington-dc', cc: 'US', yearOpened: 1976, interchange: true },
    { slug: 'gallery-pl', name: 'Gallery Pl-Chinatown', nameKa: 'gallery-pl', lat: 38.8983, lng: -77.0217, line: 'Red / Green / Yellow', citySlug: 'washington-dc', cc: 'US', yearOpened: 1976, interchange: true },
    { slug: 'union-station', name: 'Union Station', nameKa: 'union-station', lat: 38.8972, lng: -77.0065, line: 'Red', citySlug: 'washington-dc', cc: 'US', yearOpened: 1976, interchange: true },
    { slug: 'l-enfant', name: 'L\'Enfant Plaza', nameKa: 'lenfant-plaza', lat: 38.8849, lng: -77.0219, line: 'Green / Yellow / Blue / Orange / Silver', citySlug: 'washington-dc', cc: 'US', yearOpened: 1983, interchange: true },
    { slug: 'dulles', name: 'Dulles Airport', nameKa: 'dulles', lat: 38.9507, lng: -77.4486, line: 'Silver', citySlug: 'washington-dc', cc: 'US', yearOpened: 2022, interchange: false },
    { slug: 'pentagon', name: 'Pentagon', nameKa: 'pentagon', lat: 38.8717, lng: -77.0559, line: 'Blue / Yellow', citySlug: 'washington-dc', cc: 'US', yearOpened: 1977, interchange: true },
  ],
}

const bostonT: MetroSystemData = {
  citySlug: 'boston',
  cc: 'US',
  name: 'Boston MBTA (The T)',
  status: 'operational',
  totalKm: 148.0,
  totalStations: 149,
  yearOpened: 1897,
  dailyRidership: 400_000,
  lines: [
    { name: 'Red Line', color: '#DA291C', stations: 22, km: 22.5, yearOpened: 1912 },
    { name: 'Orange Line', color: '#ED8B00', stations: 20, km: 18.8, yearOpened: 1901 },
    { name: 'Blue Line', color: '#003DA5', stations: 12, km: 8.1, yearOpened: 1904 },
    { name: 'Green Line', color: '#00843D', stations: 66, km: 23.0, yearOpened: 1897 },
    { name: 'Silver Line', color: '#A7A9AC', stations: 19, km: 10.0, yearOpened: 2004 },
  ],
  stations: [
    { slug: 'park-street', name: 'Park Street', nameKa: 'park-street', lat: 42.3564, lng: -71.0624, line: 'Red / Green', citySlug: 'boston', cc: 'US', yearOpened: 1897, interchange: true },
    { slug: 'downtown-crossing', name: 'Downtown Crossing', nameKa: 'downtown-crossing', lat: 42.3554, lng: -71.0603, line: 'Red / Orange', citySlug: 'boston', cc: 'US', yearOpened: 1901, interchange: true },
    { slug: 'north-station', name: 'North Station', nameKa: 'north-station', lat: 42.3655, lng: -71.0613, line: 'Green / Orange / Commuter Rail', citySlug: 'boston', cc: 'US', yearOpened: 1897, interchange: true },
    { slug: 'south-station', name: 'South Station', nameKa: 'south-station', lat: 42.3519, lng: -71.0552, line: 'Red / Silver / Commuter Rail', citySlug: 'boston', cc: 'US', yearOpened: 1899, interchange: true },
    { slug: 'back-bay', name: 'Back Bay', nameKa: 'back-bay', lat: 42.3473, lng: -71.0758, line: 'Orange / Commuter Rail', citySlug: 'boston', cc: 'US', yearOpened: 1987, interchange: true },
    { slug: 'harvard', name: 'Harvard', nameKa: 'harvard', lat: 42.3736, lng: -71.1189, line: 'Red', citySlug: 'boston', cc: 'US', yearOpened: 1912, interchange: false },
  ],
}

const chicagoL: MetroSystemData = {
  citySlug: 'chicago',
  cc: 'US',
  name: 'Chicago L',
  status: 'operational',
  totalKm: 165.0,
  totalStations: 145,
  yearOpened: 1892,
  dailyRidership: 600_000,
  lines: [
    { name: 'Blue Line (O\'Hare)', color: '#00A1DE', stations: 33, km: 42.0, yearOpened: 1984 },
    { name: 'Blue Line (Forest Park)', color: '#00A1DE', stations: 20, km: 26.0, yearOpened: 1892 },
    { name: 'Brown Line', color: '#62351E', stations: 27, km: 25.0, yearOpened: 1893 },
    { name: 'Green Line (Lake)', color: '#009B3A', stations: 22, km: 26.0, yearOpened: 1892 },
    { name: 'Green Line (Ashland)', color: '#009B3A', stations: 17, km: 17.0, yearOpened: 1893 },
    { name: 'Green Line (Cottage Grove)', color: '#009B3A', stations: 14, km: 11.0, yearOpened: 1893 },
    { name: 'Orange Line', color: '#F94639', stations: 17, km: 17.0, yearOpened: 1993 },
    { name: 'Pink Line', color: '#E27EA6', stations: 17, km: 17.0, yearOpened: 2006 },
    { name: 'Purple Line Express', color: '#522398', stations: 13, km: 13.0, yearOpened: 1912 },
    { name: 'Red Line (Howard)', color: '#C61029', stations: 28, km: 30.0, yearOpened: 1893 },
    { name: 'Red Line (Dan Ryan)', color: '#C61029', stations: 14, km: 14.0, yearOpened: 1969 },
    { name: 'Yellow Line (Skokie Swift)', color: '#F9D317', stations: 4, km: 4.5, yearOpened: 1964 },
  ],
  stations: [
    { slug: 'jackson', name: 'Jackson', nameKa: 'jackson', lat: 41.8780, lng: -87.6274, line: 'Blue / Red', citySlug: 'chicago', cc: 'US', yearOpened: 1893, interchange: true },
    { slug: 'monroe', name: 'Monroe', nameKa: 'monroe', lat: 41.8809, lng: -87.6274, line: 'Blue / Red / Brown / Purple', citySlug: 'chicago', cc: 'US', yearOpened: 1897, interchange: true },
    { slug: 'clark-lake', name: 'Clark/Lake', nameKa: 'clark-lake', lat: 41.8846, lng: -87.6310, line: 'Blue / Green / Orange / Pink / Purple', citySlug: 'chicago', cc: 'US', yearOpened: 1895, interchange: true },
    { slug: 'state-lake', name: 'State/Lake', nameKa: 'state-lake', lat: 41.8844, lng: -87.6276, line: 'Red / Pink / Purple', citySlug: 'chicago', cc: 'US', yearOpened: 1893, interchange: true },
    { slug: 'washington-wabash', name: 'Washington/Wabash', nameKa: 'washington-wabash', lat: 41.8831, lng: -87.6260, line: 'Brown / Green / Orange / Pink / Purple', citySlug: 'chicago', cc: 'US', yearOpened: 2017, interchange: true },
    { slug: 'logan-square', name: 'Logan Square', nameKa: 'logan-square', lat: 41.9293, lng: -87.7080, line: 'Blue', citySlug: 'chicago', cc: 'US', yearOpened: 1892, interchange: false },
    { slug: 'ohare', name: 'O\'Hare', nameKa: 'ohare', lat: 41.9776, lng: -87.9040, line: 'Blue', citySlug: 'chicago', cc: 'US', yearOpened: 1984, interchange: false },
    { slug: 'roosevelt', name: 'Roosevelt', nameKa: 'roosevelt', lat: 41.8672, lng: -87.6259, line: 'Red / Green / Orange', citySlug: 'chicago', cc: 'US', yearOpened: 1993, interchange: true },
  ],
}

const sanFranciscoBART: MetroSystemData = {
  citySlug: 'san-francisco',
  cc: 'US',
  name: 'BART / Muni Metro',
  status: 'operational',
  totalKm: 210.0,
  totalStations: 50,
  yearOpened: 1972,
  dailyRidership: 400_000,
  lines: [
    { name: 'Yellow (Antioch)', color: '#F5D122', stations: 15, km: 50.0, yearOpened: 1972 },
    { name: 'Green (Berryessa)', color: '#009B3A', stations: 14, km: 45.0, yearOpened: 1972 },
    { name: 'Blue (Dublin/Pleasanton)', color: '#0072BA', stations: 12, km: 35.0, yearOpened: 1972 },
    { name: 'Red (Richmond)', color: '#C61029', stations: 14, km: 40.0, yearOpened: 1972 },
    { name: 'Orange (Richmond)', color: '#E57822', stations: 12, km: 25.0, yearOpened: 1974 },
    { name: 'Muni Metro (7 lines)', color: '#999999', stations: 120, km: 60.0, yearOpened: 1980 },
  ],
  stations: [
    { slug: 'civic-center', name: 'Civic Center/Plaza', nameKa: 'civic-center', lat: 37.7798, lng: -122.4144, line: 'All BART lines', citySlug: 'san-francisco', cc: 'US', yearOpened: 1972, interchange: true },
    { slug: 'powell', name: 'Powell Street', nameKa: 'powell', lat: 37.7845, lng: -122.4079, line: 'All BART lines', citySlug: 'san-francisco', cc: 'US', yearOpened: 1972, interchange: true },
    { slug: 'montgomery', name: 'Montgomery Street', nameKa: 'montgomery', lat: 37.7893, lng: -122.4015, line: 'All BART lines', citySlug: 'san-francisco', cc: 'US', yearOpened: 1972, interchange: true },
    { slug: 'embarcadero', name: 'Embarcadero', nameKa: 'embarcadero', lat: 37.7931, lng: -122.3961, line: 'All BART lines', citySlug: 'san-francisco', cc: 'US', yearOpened: 1976, interchange: true },
    { slug: 'san-francisco-airport', name: 'San Francisco Airport', nameKa: 'sf-airport', lat: 37.6161, lng: -122.3927, line: 'Yellow / Blue', citySlug: 'san-francisco', cc: 'US', yearOpened: 2003, interchange: false },
    { slug: 'daly-city', name: 'Daly City', nameKa: 'daly-city', lat: 37.7061, lng: -122.4686, line: 'All BART lines', citySlug: 'san-francisco', cc: 'US', yearOpened: 1972, interchange: true },
    { slug: 'west-dublin', name: 'West Dublin/Pleasanton', nameKa: 'west-dublin', lat: 37.6998, lng: -121.9291, line: 'Blue', citySlug: 'san-francisco', cc: 'US', yearOpened: 1997, interchange: false },
  ],
}

const laMetro: MetroSystemData = {
  citySlug: 'los-angeles',
  cc: 'US',
  name: 'Los Angeles Metro Rail',
  status: 'operational',
  totalKm: 145.0,
  totalStations: 101,
  yearOpened: 1990,
  dailyRidership: 300_000,
  lines: [
    { name: 'A Line (Blue)', color: '#0072BA', stations: 20, km: 31.0, yearOpened: 1990 },
    { name: 'B Line (Red)', color: '#E5171F', stations: 14, km: 14.0, yearOpened: 1993 },
    { name: 'C Line (Green)', color: '#009B3A', stations: 14, km: 17.0, yearOpened: 1995 },
    { name: 'D Line (Purple)', color: '#6C3082', stations: 7, km: 6.0, yearOpened: 1993 },
    { name: 'E Line (Expo)', color: '#F5D122', stations: 20, km: 15.0, yearOpened: 2012 },
    { name: 'G Line (Orange BRT)', color: '#F58220', stations: 18,  km: 29.0, yearOpened: 2005 },
    { name: 'K Line (Crenshaw)', color: '#9B26B6', stations: 12, km: 8.5, yearOpened: 2022 },
  ],
  stations: [
    { slug: 'union-station-la', name: 'Union Station', nameKa: 'union-station', lat: 34.0561, lng: -118.2365, line: 'A / B / D / Gold / Silver', citySlug: 'los-angeles', cc: 'US', yearOpened: 1993, interchange: true },
    { slug: '7th-st-metro', name: '7th St/Metro Center', nameKa: '7th-st-metro', lat: 34.0496, lng: -118.2591, line: 'A / B / D / E', citySlug: 'los-angeles', cc: 'US', yearOpened: 1993, interchange: true },
    { slug: 'pershing-square', name: 'Pershing Square', nameKa: 'pershing-square', lat: 34.0474, lng: -118.2535, line: 'A / B / D / E', citySlug: 'los-angeles', cc: 'US', yearOpened: 1993, interchange: true },
    { slug: 'civic-center', name: 'Civic Center/Grand Park', nameKa: 'civic-center', lat: 34.0557, lng: -118.2439, line: 'B / D', citySlug: 'los-angeles', cc: 'US', yearOpened: 1999, interchange: true },
    { slug: 'hollywood-vine', name: 'Hollywood/Vine', nameKa: 'hollywood-vine', lat: 34.1013, lng: -118.3257, line: 'B / D', citySlug: 'los-angeles', cc: 'US', yearOpened: 1999, interchange: true },
  ],
}

const philadelphiaSEPTA: MetroSystemData = {
  citySlug: 'philadelphia',
  cc: 'US',
  name: 'SEPTA (Philadelphia)',
  status: 'operational',
  totalKm: 105.0,
  totalStations: 85,
  yearOpened: 1907,
  dailyRidership: 350_000,
  lines: [
    { name: 'Market-Frankford (Blue)', color: '#0072BA', stations: 28, km: 23.0, yearOpened: 1907 },
    { name: 'Broad Street (Orange)', color: '#E57822', stations: 22, km: 13.0, yearOpened: 1928 },
    { name: 'PATCO Speedline', color: '#E5171F', stations: 13, km: 14.5, yearOpened: 1932 },
    { name: 'Norristown High Speed', color: '#7B5D37', stations: 22, km: 21.0, yearOpened: 1907 },
  ],
  stations: [
    { slug: 'city-hall-philly', name: 'City Hall', nameKa: 'city-hall', lat: 39.9524, lng: -75.1635, line: 'Market-Frankford / Broad Street', citySlug: 'philadelphia', cc: 'US', yearOpened: 1907, interchange: true },
    { slug: '30th-street', name: '30th Street Station', nameKa: '30th-street', lat: 39.9566, lng: -75.1819, line: 'Market-Frankford / PATCO', citySlug: 'philadelphia', cc: 'US', yearOpened: 1933, interchange: true },
    { slug: '5th-street', name: '5th Street/Independence Hall', nameKa: '5th-street', lat: 39.9480, lng: -75.1497, line: 'Market-Frankford / PATCO', citySlug: 'philadelphia', cc: 'US', yearOpened: 1936, interchange: true },
    { slug: 'eastwick', name: 'Eastwick', nameKa: 'eastwick', lat: 39.8834, lng: -75.2349, line: 'Market-Frankford / PATCO', citySlug: 'philadelphia', cc: 'US', yearOpened: 1936, interchange: true },
  ],
}

const miamiMetrorail: MetroSystemData = {
  citySlug: 'miami',
  cc: 'US',
  name: 'Miami Metrorail',
  status: 'operational',
  totalKm: 38.0,
  totalStations: 23,
  yearOpened: 1984,
  dailyRidership: 100_000,
  lines: [
    { name: 'Metrorail', color: '#00A1DE', stations: 23, km: 38.0, yearOpened: 1984 },
    { name: 'Metromover', color: '#9B26B6', stations: 21, km: 7.0, yearOpened: 1986 },
  ],
  stations: [
    { slug: 'government-center', name: 'Government Center', nameKa: 'government-center', lat: 25.7762, lng: -80.1930, line: 'Metrorail / Metromover', citySlug: 'miami', cc: 'US', yearOpened: 1984, interchange: true },
    { slug: 'brickell', name: 'Brickell', nameKa: 'brickell', lat: 25.7574, lng: -80.1935, line: 'Metrorail / Metromover', citySlug: 'miami', cc: 'US', yearOpened: 1984, interchange: true },
    { slug: 'airport-miami', name: 'Miami International Airport', nameKa: 'miami-airport', lat: 25.7957, lng: -80.2881, line: 'Metrorail', citySlug: 'miami', cc: 'US', yearOpened: 2012, interchange: false },
  ],
}

const atlantaMARTA: MetroSystemData = {
  citySlug: 'atlanta',
  cc: 'US',
  name: 'Atlanta MARTA',
  status: 'operational',
  totalKm: 76.0,
  totalStations: 39,
  yearOpened: 1981,
  dailyRidership: 150_000,
  lines: [
    { name: 'Red Line (North-South)', color: '#C61029', stations: 19, km: 25.0, yearOpened: 1981 },
    { name: 'Gold Line (North-South)', color: '#F5D122', stations: 19, km: 25.0, yearOpened: 1988 },
    { name: 'Blue Line (East-West)', color: '#0072BA', stations: 15, km: 19.0, yearOpened: 1984 },
  ],
  stations: [
    { slug: 'five-points', name: 'Five Points', nameKa: 'five-points', lat: 33.7540, lng: -84.3916, line: 'Red / Gold / Blue', citySlug: 'atlanta', cc: 'US', yearOpened: 1981, interchange: true },
    { slug: 'peachtree-center', name: 'Peachtree Center', nameKa: 'peachtree-center', lat: 33.7590, lng: -84.3877, line: 'Red / Gold', citySlug: 'atlanta', cc: 'US', yearOpened: 1981, interchange: false },
    { slug: 'hartsfield-airport', name: 'Hartsfield-Jackson Airport', nameKa: 'hartsfield-airport', lat: 33.6401, lng: -84.4269, line: 'Red / Gold', citySlug: 'atlanta', cc: 'US', yearOpened: 1988, interchange: false },
    { slug: 'dekalb-medical', name: 'Decatur', nameKa: 'decatur', lat: 33.7748, lng: -84.2963, line: 'Blue / Gold', citySlug: 'atlanta', cc: 'US', yearOpened: 1984, interchange: true },
  ],
}

const torontoTTC: MetroSystemData = {
  citySlug: 'toronto',
  cc: 'CA',
  name: 'Toronto TTC Subway',
  status: 'operational',
  totalKm: 76.0,
  totalStations: 75,
  yearOpened: 1954,
  dailyRidership: 1_100_000,
  lines: [
    { name: 'Line 1 Yonge-University', color: '#F5D122', stations: 38, km: 38.0, yearOpened: 1954 },
    { name: 'Line 2 Bloor-Danforth', color: '#E5171F', stations: 31, km: 26.0, yearOpened: 1966 },
    { name: 'Line 3 Scarborough', color: '#009B3A', stations: 6, km: 6.5, yearOpened: 1985 },
    { name: 'Line 4 Sheppard', color: '#9B26B6', stations: 5, km: 5.5, yearOpened: 2002 },
  ],
  stations: [
    { slug: 'bloor-yonge', name: 'Bloor-Yonge', nameKa: 'bloor-yonge', lat: 43.6714, lng: -79.3862, line: 'Line 1 / Line 2', citySlug: 'toronto', cc: 'CA', yearOpened: 1954, interchange: true },
    { slug: 'st-george', name: 'St George', nameKa: 'st-george', lat: 43.6681, lng: -79.4003, line: 'Line 1 / Line 2', citySlug: 'toronto', cc: 'CA', yearOpened: 1966, interchange: true },
    { slug: 'spadina', name: 'Spadina', nameKa: 'spadina', lat: 43.6673, lng: -79.4033, line: 'Line 1 / Line 2', citySlug: 'toronto', cc: 'CA', yearOpened: 1966, interchange: true },
    { slug: 'union-station-toronto', name: 'Union', nameKa: 'union', lat: 43.6453, lng: -79.3807, line: 'Line 1 / GO Transit', citySlug: 'toronto', cc: 'CA', yearOpened: 1954, interchange: true },
    { slug: 'york-mills', name: 'York Mills', nameKa: 'york-mills', lat: 43.7437, lng: -79.4007, line: 'Line 1', citySlug: 'toronto', cc: 'CA', yearOpened: 1974, interchange: false },
    { slug: 'finch', name: 'Finch', nameKa: 'finch', lat: 43.7812, lng: -79.4156, line: 'Line 1', citySlug: 'toronto', cc: 'CA', yearOpened: 1974, interchange: false },
    { slug: 'kennedy', name: 'Kennedy', nameKa: 'kennedy', lat: 43.7320, lng: -79.2840, line: 'Line 2 / Line 3', citySlug: 'toronto', cc: 'CA', yearOpened: 1985, interchange: true },
    { slug: 'sheppard-yonge', name: 'Sheppard-Yonge', nameKa: 'sheppard-yonge', lat: 43.7611, lng: -79.3993, line: 'Line 1 / Line 4', citySlug: 'toronto', cc: 'CA', yearOpened: 2002, interchange: true },
  ],
}

const montrealMetro: MetroSystemData = {
  citySlug: 'montreal',
  cc: 'CA',
  name: 'Montreal Metro',
  status: 'operational',
  totalKm: 66.0,
  totalStations: 68,
  yearOpened: 1966,
  dailyRidership: 1_300_000,
  lines: [
    { name: 'Line 1 (Green)', color: '#009B3A', stations: 27, km: 22.1, yearOpened: 1966 },
    { name: 'Line 2 (Orange)', color: '#E57822', stations: 31, km: 24.8, yearOpened: 1966 },
    { name: 'Line 4 (Yellow)', color: '#F5D122', stations: 3, km: 4.5, yearOpened: 1967 },
    { name: 'Line 5 (Blue)', color: '#0072BA', stations: 12, km: 9.7, yearOpened: 1986 },
  ],
  stations: [
    { slug: 'berri-uqam', name: 'Berri-UQAM', nameKa: 'berri-uqam', lat: 45.5088, lng: -73.5660, line: 'Green / Orange / Blue', citySlug: 'montreal', cc: 'CA', yearOpened: 1966, interchange: true },
    { slug: 'jean-talon', name: 'Jean-Talon', nameKa: 'jean-talon', lat: 45.5430, lng: -73.6117, line: 'Orange / Blue', citySlug: 'montreal', cc: 'CA', yearOpened: 1966, interchange: true },
    { slug: 'mcgill', name: 'McGill', nameKa: 'mcgill', lat: 45.5047, lng: -73.5772, line: 'Green', citySlug: 'montreal', cc: 'CA', yearOpened: 1966, interchange: false },
    { slug: 'place-des-arts', name: 'Place-des-Arts', nameKa: 'place-des-arts', lat: 45.5066, lng: -73.5687, line: 'Green', citySlug: 'montreal', cc: 'CA', yearOpened: 1966, interchange: false },
    { slug: 'atwater', name: 'Atwater', nameKa: 'atwater', lat: 45.4896, lng: -73.5820, line: 'Green / Orange', citySlug: 'montreal', cc: 'CA', yearOpened: 1966, interchange: true },
  ],
}

const vancouverSkyTrain: MetroSystemData = {
  citySlug: 'vancouver',
  cc: 'CA',
  name: 'Vancouver SkyTrain',
  status: 'operational',
  totalKm: 79.6,
  totalStations: 53,
  yearOpened: 1985,
  dailyRidership: 500_000,
  lines: [
    { name: 'Expo Line', color: '#0072BA', stations: 20, km: 29.8, yearOpened: 1985 },
    { name: 'Millennium Line', color: '#FFCC00', stations: 17, km: 26.0, yearOpened: 2002 },
    { name: 'Canada Line', color: '#E5171F', stations: 16, km: 19.0, yearOpened: 2009 },
  ],
  stations: [
    { slug: 'waterfront-vancouver', name: 'Waterfront', nameKa: 'waterfront', lat: 49.2844, lng: -123.1115, line: 'Expo / Millennium / Canada Line', citySlug: 'vancouver', cc: 'CA', yearOpened: 1985, interchange: true },
    { slug: 'granville', name: 'Granville', nameKa: 'granville', lat: 49.2801, lng: -123.1134, line: 'Expo / Millennium', citySlug: 'vancouver', cc: 'CA', yearOpened: 1985, interchange: true },
    { slug: 'commercial-drive', name: 'Commercial-Broadway', nameKa: 'commercial-drive', lat: 49.2649, lng: -123.0706, line: 'Expo / Millennium', citySlug: 'vancouver', cc: 'CA', yearOpened: 1985, interchange: true },
    { slug: 'metrotown', name: 'Metrotown', nameKa: 'metrotown', lat: 49.2260, lng: -123.0014, line: 'Expo', citySlug: 'vancouver', cc: 'CA', yearOpened: 1985, interchange: false },
    { slug: 'yvr-airport', name: 'YVR Airport', nameKa: 'yvr-airport', lat: 49.1947, lng: -123.1790, line: 'Canada Line', citySlug: 'vancouver', cc: 'CA', yearOpened: 2009, interchange: false },
    { slug: 'brighouse', name: 'Richmond-Brighouse', nameKa: 'richmond-brighouse', lat: 49.1713, lng: -123.1375, line: 'Canada Line', citySlug: 'vancouver', cc: 'CA', yearOpened: 2009, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// AMERICAS — LATIN AMERICA
// ────────────────────────────────────────────────────────────────

const mexicoCityMetro: MetroSystemData = {
  citySlug: 'mexico-city',
  cc: 'MX',
  name: 'Mexico City Metro',
  status: 'operational',
  totalKm: 226.0,
  totalStations: 195,
  yearOpened: 1969,
  dailyRidership: 4_500_000,
  lines: [
    { name: 'Line 1', color: '#E5171F', stations: 20, km: 18.8, yearOpened: 1969 },
    { name: 'Line 2', color: '#0072BA', stations: 24, km: 23.4, yearOpened: 1970 },
    { name: 'Line 3', color: '#009B3A', stations: 21, km: 23.7, yearOpened: 1970 },
    { name: 'Line 4', color: '#C61029', stations: 10, km: 10.4, yearOpened: 1981 },
    { name: 'Line 5', color: '#FFCC00', stations: 13, km: 15.7, yearOpened: 1981 },
    { name: 'Line 6', color: '#00A1DE', stations: 11, km: 13.0, yearOpened: 1983 },
    { name: 'Line 7', color: '#E57822', stations: 14, km: 17.1, yearOpened: 1985 },
    { name: 'Line 8', color: '#6C3082', stations: 19, km: 20.2, yearOpened: 1994 },
    { name: 'Line 9', color: '#7B5D37', stations: 12, km: 13.1, yearOpened: 1987 },
    { name: 'Line A', color: '#F58220', stations: 10, km: 17.2, yearOpened: 1991 },
    { name: 'Line B', color: '#9B26B6', stations: 21, km: 23.7, yearOpened: 2000 },
  ],
  stations: [
    { slug: 'zocalo', name: 'Zocalo', nameKa: 'zocalo', lat: 19.4325, lng: -99.1332, line: 'Line 2', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1970, interchange: false },
    { slug: 'pino-suarez', name: 'Pino Suarez', nameKa: 'pino-suarez', lat: 19.4267, lng: -99.1350, line: 'Line 1 / 2', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1969, interchange: true },
    { slug: 'pantitlan', name: 'Pantitlan', nameKa: 'pantitlan', lat: 19.4157, lng: -99.0722, line: 'Line 1 / 5 / 9 / A', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1969, interchange: true },
    { slug: 'chapultepec', name: 'Chapultepec', nameKa: 'chapultepec', lat: 19.4200, lng: -99.1860, line: 'Line 1', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1969, interchange: false },
    { slug: 'insurgentes', name: 'Insurgentes', nameKa: 'insurgentes', lat: 19.4225, lng: -99.1566, line: 'Line 1', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1969, interchange: false },
    { slug: 'tapia', name: 'Tacubaya', nameKa: 'tacubaya', lat: 19.4035, lng: -99.1899, line: 'Line 1 / 3 / 9', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1969, interchange: true },
    { slug: 'hidalgo', name: 'Hidalgo', nameKa: 'hidalgo', lat: 19.4333, lng: -99.1528, line: 'Line 3 / 8', citySlug: 'mexico-city', cc: 'MX', yearOpened: 1970, interchange: true },
    { slug: 'buenavista', name: 'Buena Vista', nameKa: 'buena-vista', lat: 19.4360, lng: -99.1411, line: 'Line B', citySlug: 'mexico-city', cc: 'MX', yearOpened: 2000, interchange: false },
  ],
}

const buenosAiresSubte: MetroSystemData = {
  citySlug: 'buenos-aires',
  cc: 'AR',
  name: 'Buenos Aires Subte',
  status: 'operational',
  totalKm: 56.7,
  totalStations: 90,
  yearOpened: 1913,
  dailyRidership: 1_800_000,
  lines: [
    { name: 'Line A', color: '#0072BA', stations: 17, km: 9.8, yearOpened: 1913 },
    { name: 'Line B', color: '#E5171F', stations: 14, km: 11.8, yearOpened: 1930 },
    { name: 'Line C', color: '#009B3A', stations: 9, km: 4.5, yearOpened: 1934 },
    { name: 'Line D', color: '#FFCC00', stations: 16, km: 10.0, yearOpened: 1937 },
    { name: 'Line E', color: '#6C3082', stations: 15, km: 9.1, yearOpened: 1944 },
    { name: 'Line H', color: '#FF8C00', stations: 12, km: 8.8, yearOpened: 2007 },
  ],
  stations: [
    { slug: 'obrero-unido', name: 'Plaza de Mayo', nameKa: 'plaza-de-mayo', lat: -34.6037, lng: -58.3816, line: 'Line A', citySlug: 'buenos-aires', cc: 'AR', yearOpened: 1913, interchange: false },
    { slug: 'peru', name: 'Peru', nameKa: 'peru', lat: -34.6020, lng: -58.3760, line: 'Line A', citySlug: 'buenos-aires', cc: 'AR', yearOpened: 1913, interchange: false },
    { slug: 'callao', name: 'Callao', nameKa: 'callao', lat: -34.6034, lng: -58.3829, line: 'Line A / Line D', citySlug: 'buenos-aires', cc: 'AR', yearOpened: 1913, interchange: true },
    { slug: 'congreso', name: 'Congreso', nameKa: 'congreso', lat: -34.6065, lng: -58.3883, line: 'Line A / Line D', citySlug: 'buenos-aires', cc: 'AR', yearOpened: 1913, interchange: true },
    { slug: 'lavalle', name: 'Lavalle', nameKa: 'lavalle', lat: -34.5998, lng: -58.3776, line: 'Line D', citySlug: 'buenos-aires', cc: 'AR', yearOpened: 1937, interchange: false },
    { slug: 'catedral', name: 'Catedral', nameKa: 'catedral', lat: -34.6036, lng: -58.3760, line: 'Line D', citySlug: 'buenos-aires', cc: 'AR', yearOpened: 1937, interchange: false },
  ],
}

const santiagoMetro: MetroSystemData = {
  citySlug: 'santiago',
  cc: 'CL',
  name: 'Santiago Metro',
  status: 'operational',
  totalKm: 139.0,
  totalStations: 136,
  yearOpened: 1975,
  dailyRidership: 2_500_000,
  lines: [
    { name: 'Line 1', color: '#E5171F', stations: 27, km: 22.0, yearOpened: 1975 },
    { name: 'Line 2', color: '#0072BA', stations: 22, km: 22.0, yearOpened: 1978 },
    { name: 'Line 3', color: '#009B3A', stations: 18, km: 21.0, yearOpened: 2019 },
    { name: 'Line 4', color: '#FFCC00', stations: 23, km: 24.0, yearOpened: 2005 },
    { name: 'Line 4A', color: '#F58220', stations: 6, km: 7.5, yearOpened: 2006 },
    { name: 'Line 5', color: '#6C3082', stations: 30, km: 32.0, yearOpened: 2004 },
    { name: 'Line 6', color: '#00A1DE', stations: 10, km: 10.5, yearOpened: 2023 },
  ],
  stations: [
    { slug: 'los-heros', name: 'Los Héroes', nameKa: 'los-heroes', lat: -33.4510, lng: -70.6690, line: 'Line 1 / 2', citySlug: 'santiago', cc: 'CL', yearOpened: 1975, interchange: true },
    { slug: 'la-moneda', name: 'La Moneda', nameKa: 'la-moneda', lat: -33.4425, lng: -70.6530, line: 'Line 1 / 2', citySlug: 'santiago', cc: 'CL', yearOpened: 1975, interchange: true },
    { slug: 'baquedano', name: 'Baquedano', nameKa: 'baquedano', lat: -33.4386, lng: -70.6315, line: 'Line 1 / 5', citySlug: 'santiago', cc: 'CL', yearOpened: 1975, interchange: true },
    { slug: 'tobalaba', name: 'Tobalaba', nameKa: 'tobalaba', lat: -33.4581, lng: -70.6040, line: 'Line 1 / 4', citySlug: 'santiago', cc: 'CL', yearOpened: 1975, interchange: true },
    { slug: 'california', name: 'California', nameKa: 'california', lat: -33.4421, lng: -70.5915, line: 'Line 6', citySlug: 'santiago', cc: 'CL', yearOpened: 2023, interchange: false },
  ],
}

const saoPauloMetro: MetroSystemData = {
  citySlug: 'sao-paulo',
  cc: 'BR',
  name: 'Sao Paulo Metro',
  status: 'operational',
  totalKm: 102.0,
  totalStations: 91,
  yearOpened: 1968,
  dailyRidership: 4_800_000,
  lines: [
    { name: 'Line 1 (Blue)', color: '#0072BA', stations: 23, km: 20.2, yearOpened: 1968 },
    { name: 'Line 2 (Green)', color: '#009B3A', stations: 22, km: 23.7, yearOpened: 1991 },
    { name: 'Line 3 (Red)', color: '#E5171F', stations: 18, km: 22.0, yearOpened: 2000 },
    { name: 'Line 4 (Yellow)', color: '#FFCC00', stations: 16, km: 12.8, yearOpened: 2010 },
    { name: 'Line 5 (Lilac)', color: '#C86A2C', stations: 12, km: 11.0, yearOpened: 2002 },
    { name: 'Line 15 (Silver)', color: '#A7A9AC', stations: 8, km: 8.0, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'se', name: 'Se', nameKa: 'se', lat: -23.5505, lng: -46.6333, line: 'Line 1 / 3', citySlug: 'sao-paulo', cc: 'BR', yearOpened: 1968, interchange: true },
    { slug: 'liberdade', name: 'Liberdade', nameKa: 'liberdade', lat: -23.5520, lng: -46.6320, line: 'Line 1 / 2', citySlug: 'sao-paulo', cc: 'BR', yearOpened: 1975, interchange: true },
    { slug: 'paraiso', name: 'Paraíso', nameKa: 'paraiso', lat: -23.5613, lng: -46.6397, line: 'Line 1 / 2 / 4', citySlug: 'sao-paulo', cc: 'BR', yearOpened: 1968, interchange: true },
    { slug: 'consolacao', name: 'Consolação', nameKa: 'consolacao', lat: -23.5573, lng: -46.6537, line: 'Line 2 / 4', citySlug: 'sao-paulo', cc: 'BR', yearOpened: 1978, interchange: true },
    { slug: 'ana-rosa', name: 'Ana Rosa', nameKa: 'ana-rosa', lat: -23.5813, lng: -46.6384, line: 'Line 2 / 4', citySlug: 'sao-paulo', cc: 'BR', yearOpened: 1978, interchange: true },
    { slug: 'tiete', name: 'Tietê', nameKa: 'tiete', lat: -23.5251, lng: -46.6223, line: 'Line 1 / 3', citySlug: 'sao-paulo', cc: 'BR', yearOpened: 2000, interchange: true },
  ],
}

const rioMetro: MetroSystemData = {
  citySlug: 'rio-de-janeiro',
  cc: 'BR',
  name: 'Rio de Janeiro Metro',
  status: 'operational',
  totalKm: 58.0,
  totalStations: 41,
  yearOpened: 1979,
  dailyRidership: 900_000,
  lines: [
    { name: 'Line 1 (Orange)', color: '#E57822', stations: 20, km: 18.0, yearOpened: 1979 },
    { name: 'Line 2 (Green)', color: '#009B3A', stations: 21, km: 30.0, yearOpened: 1980 },
  ],
  stations: [
    { slug: 'carioca', name: 'Carioca', nameKa: 'carioca', lat: -22.9067, lng: -43.1782, line: 'Line 1 / 2', citySlug: 'rio-de-janeiro', cc: 'BR', yearOpened: 1979, interchange: true },
    { slug: 'estacao-saude', name: 'Estácio', nameKa: 'estacio', lat: -22.9120, lng: -43.1790, line: 'Line 1 / 2', citySlug: 'rio-de-janeiro', cc: 'BR', yearOpened: 1979, interchange: true },
    { slug: 'central-do-brasil', name: 'Central do Brasil', nameKa: 'central-do-brasil', lat: -22.9017, lng: -43.1812, line: 'Line 1 / 2 / Trains', citySlug: 'rio-de-janeiro', cc: 'BR', yearOpened: 1979, interchange: true },
    { slug: 'botafogo', name: 'Botafogo', nameKa: 'botafogo', lat: -22.9505, lng: -43.1770, line: 'Line 1', citySlug: 'rio-de-janeiro', cc: 'BR', yearOpened: 1979, interchange: false },
    { slug: 'copacabana', name: 'Cardeal Arcoverde', nameKa: 'cardeal-arcoverde', lat: -22.9712, lng: -43.1809, line: 'Line 1', citySlug: 'rio-de-janeiro', cc: 'BR', yearOpened: 1979, interchange: false },
    { slug: 'ilha-do-fundo', name: 'Ilha do Fundão', nameKa: 'ilha-do-fundo', lat: -22.8549, lng: -43.2295, line: 'Line 2', citySlug: 'rio-de-janeiro', cc: 'BR', yearOpened: 1998, interchange: false },
  ],
}

const bogotaMetro: MetroSystemData = {
  citySlug: 'bogota',
  cc: 'CO',
  name: 'Bogota Metro + TransMilenio',
  status: 'operational',
  totalKm: 140.0,
  totalStations: 107,
  yearOpened: 2000,
  dailyRidership: 2_700_000,
  lines: [
    { name: 'Line 1 (Metro)', color: '#E5171F', stations: 14, km: 9.5, yearOpened: 2025 },
    { name: 'TransMilenio (278 stations, many corridors)', color: '#009B3A', stations: 107, km: 110.0, yearOpened: 2000 },
    { name: 'TransMilenio BRT (expansion)', color: '#0072BA', stations: 85, km: 70.0, yearOpened: 2005 },
  ],
  stations: [
    { slug: 'salitre-el-mundo', name: 'Salitre - El Mundo', nameKa: 'salitre-el-mundo', lat: 4.6605, lng: -74.1050, line: 'Line 1', citySlug: 'bogota', cc: 'CO', yearOpened: 2025, interchange: false },
    { slug: 'av-chile', name: 'Av. Chile', nameKa: 'av-chile', lat: 4.6573, lng: -74.0573, line: 'TransMilenio', citySlug: 'bogota', cc: 'CO', yearOpened: 2005, interchange: false },
    { slug: 'portal-de-la-80', name: 'Portal de la 80', nameKa: 'portal-de-la-80', lat: 4.7237, lng: -74.1093, line: 'TransMilenio', citySlug: 'bogota', cc: 'CO', yearOpened: 2005, interchange: false },
  ],
}

const limaMetro: MetroSystemData = {
  citySlug: 'lima',
  cc: 'PE',
  name: 'Lima Metro',
  status: 'operational',
  totalKm: 35.0,
  totalStations: 26,
  yearOpened: 2011,
  dailyRidership: 500_000,
  lines: [
    { name: 'Line 1', color: '#E5171F', stations: 16, km: 21.0, yearOpened: 2011 },
    { name: 'Line 2', color: '#0072BA', stations: 10, km: 14.0, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'villa-maria', name: 'Villa Maria del Triunfo', nameKa: 'villa-maria', lat: -12.1530, lng: -76.9530, line: 'Line 1', citySlug: 'lima', cc: 'PE', yearOpened: 2011, interchange: false },
    { slug: 'san-jose', name: 'San José', nameKa: 'san-jose', lat: -12.0530, lng: -77.0190, line: 'Line 1', citySlug: 'lima', cc: 'PE', yearOpened: 2011, interchange: false },
    { slug: 'miguel-grau', name: 'Miguel Grau', nameKa: 'miguel-grau', lat: -12.0510, lng: -77.0250, line: 'Line 1', citySlug: 'lima', cc: 'PE', yearOpened: 2011, interchange: false },
  ],
}

const medellinMetro: MetroSystemData = {
  citySlug: 'medellin',
  cc: 'CO',
  name: 'Medellin Metro + Cable',
  status: 'operational',
  totalKm: 35.0,
  totalStations: 37,
  yearOpened: 1995,
  dailyRidership: 650_000,
  lines: [
    { name: 'Line A', color: '#E5171F', stations: 21, km: 23.0, yearOpened: 1995 },
    { name: 'Line B', color: '#0072BA', stations: 12, km: 8.0, yearOpened: 1996 },
    { name: 'Line L (Cable)', color: '#009B3A', stations: 4, km: 4.5, yearOpened: 2004 },
    { name: 'Line J (Cable)', color: '#FFCC00', stations: 4, km: 2.8, yearOpened: 2008 },
    { name: 'Line K (Cable)', color: '#C86A2C', stations: 3, km: 2.5, yearOpened: 2010 },
  ],
  stations: [
    { slug: 'san-antonio', name: 'San Antonio', nameKa: 'san-antonio', lat: 6.2500, lng: -75.5670, line: 'Line A / B', citySlug: 'medellin', cc: 'CO', yearOpened: 1995, interchange: true },
    { slug: 'prado', name: 'Prado', nameKa: 'prado', lat: 6.2490, lng: -75.5680, line: 'Line A / B', citySlug: 'medellin', cc: 'CO', yearOpened: 1996, interchange: true },
    { slug: 'puerta-del-norte', name: 'Puerta del Norte', nameKa: 'puerta-del-norte', lat: 6.2830, lng: -75.5560, line: 'Line A', citySlug: 'medellin', cc: 'CO', yearOpened: 1995, interchange: false },
    { slug: 'acevedo', name: 'Acevedo', nameKa: 'acevedo', lat: 6.3320, lng: -75.5230, line: 'Line A / Cable L', citySlug: 'medellin', cc: 'CO', yearOpened: 1995, interchange: true },
  ],
}

const panamaCityMetro: MetroSystemData = {
  citySlug: 'panama-city',
  cc: 'PA',
  name: 'Panama City Metro',
  status: 'operational',
  totalKm: 23.1,
  totalStations: 14,
  yearOpened: 2014,
  dailyRidership: 150_000,
  lines: [
    { name: 'Line 1', color: '#0072BA', stations: 14, km: 14.0, yearOpened: 2014 },
    { name: 'Line 2', color: '#009B3A', stations: 16, km: 22.0, yearOpened: 2023 },
  ],
  stations: [
    { slug: 'albrook', name: 'Albrook', nameKa: 'albrook', lat: 8.9735, lng: -79.5430, line: 'Line 1', citySlug: 'panama-city', cc: 'PA', yearOpened: 2014, interchange: false },
    { slug: '5-de-mayo', name: '5 de Mayo', nameKa: '5-de-mayo', lat: 8.9634, lng: -79.5383, line: 'Line 1', citySlug: 'panama-city', cc: 'PA', yearOpened: 2014, interchange: false },
    { slug: 'los-andes', name: 'Los Andes', nameKa: 'los-andes', lat: 9.0485, lng: -79.5358, line: 'Line 1', citySlug: 'panama-city', cc: 'PA', yearOpened: 2014, interchange: false },
  ],
}

const santoDomingoMetro: MetroSystemData = {
  citySlug: 'santo-domingo',
  cc: 'DO',
  name: 'Santo Domingo Metro',
  status: 'operational',
  totalKm: 27.4,
  totalStations: 30,
  yearOpened: 2009,
  dailyRidership: 250_000,
  lines: [
    { name: 'Line 1', color: '#E5171F', stations: 16, km: 14.5, yearOpened: 2009 },
    { name: 'Line 2', color: '#009B3A', stations: 14, km: 12.9, yearOpened: 2014 },
  ],
  stations: [
    { slug: 'centro-de-los-heroes', name: 'Centro de los Héroes', nameKa: 'centro-de-los-heroes', lat: 18.4862, lng: -69.9113, line: 'Line 1 / 2', citySlug: 'santo-domingo', cc: 'DO', yearOpened: 2009, interchange: true },
    { slug: 'casino', name: 'Casino', nameKa: 'casino', lat: 18.4637, lng: -69.9117, line: 'Line 1', citySlug: 'santo-domingo', cc: 'DO', yearOpened: 2009, interchange: false },
    { slug: 'los-tainos', name: 'Los Tainos', nameKa: 'los-tainos', lat: 18.4533, lng: -69.9137, line: 'Line 1', citySlug: 'santo-domingo', cc: 'DO', yearOpened: 2009, interchange: false },
  ],
}

const sanJuanTren: MetroSystemData = {
  citySlug: 'san-juan',
  cc: 'PR',
  name: 'San Juan Tren Urbano',
  status: 'operational',
  totalKm: 17.2,
  totalStations: 16,
  yearOpened: 2004,
  dailyRidership: 40_000,
  lines: [
    { name: 'Tren Urbano', color: '#0072BA', stations: 16, km: 17.2, yearOpened: 2004 },
  ],
  stations: [
    { slug: 'bayamon', name: 'Bayamon', nameKa: 'bayamon', lat: 18.3985, lng: -66.1547, line: 'Tren Urbano', citySlug: 'san-juan', cc: 'PR', yearOpened: 2004, interchange: false },
    { slug: 'deportivo', name: 'Deportivo', nameKa: 'deportivo', lat: 18.4106, lng: -66.1663, line: 'Tren Urbano', citySlug: 'san-juan', cc: 'PR', yearOpened: 2004, interchange: false },
    { slug: 'santurce', name: 'Sagrado Corazon', nameKa: 'sagrado-corazon', lat: 18.4525, lng: -66.0533, line: 'Tren Urbano', citySlug: 'san-juan', cc: 'PR', yearOpened: 2004, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// AFRICA
// ────────────────────────────────────────────────────────────────

const cairoMetro: MetroSystemData = {
  citySlug: 'cairo',
  cc: 'EG',
  name: 'Cairo Metro',
  status: 'operational',
  totalKm: 92.0,
  totalStations: 84,
  yearOpened: 1987,
  dailyRidership: 3_500_000,
  lines: [
    { name: 'Line 1 (Helwan-New El-Marg)', color: '#E5171F', stations: 35, km: 44.0, yearOpened: 1987 },
    { name: 'Line 2 (Shubra El-Kheima-Mounib)', color: '#0072BA', stations: 22, km: 21.6, yearOpened: 1996 },
    { name: 'Line 3 (Adly Mansour-Kit Kat)', color: '#009B3A', stations: 34, km: 43.0, yearOpened: 2008 },
  ],
  stations: [
    { slug: 'at-tabia', name: 'Attaba', nameKa: 'attaba', lat: 30.0525, lng: 31.2471, line: 'Line 1 / 2', citySlug: 'cairo', cc: 'EG', yearOpened: 1987, interchange: true },
    { slug: 'sadat', name: 'Sadat', nameKa: 'sadat', lat: 30.0444, lng: 31.2357, line: 'Line 1 / 2', citySlug: 'cairo', cc: 'EG', yearOpened: 1987, interchange: true },
    { slug: 'mubarak', name: 'Nasser', nameKa: 'nasser', lat: 30.0517, lng: 31.2397, line: 'Line 1 / 3', citySlug: 'cairo', cc: 'EG', yearOpened: 1987, interchange: true },
    { slug: 'al-shohadaa', name: 'Al-Shohadaa (Ramses)', nameKa: 'al-shohadaa', lat: 30.0621, lng: 31.2468, line: 'Line 1 / 2', citySlug: 'cairo', cc: 'EG', yearOpened: 1987, interchange: true },
    { slug: 'ain-shams', name: 'Ain Shams', nameKa: 'ain-shams', lat: 30.1311, lng: 31.3280, line: 'Line 1', citySlug: 'cairo', cc: 'EG', yearOpened: 1989, interchange: false },
  ],
}

const lagosMetro: MetroSystemData = {
  citySlug: 'lagos',
  cc: 'NG',
  name: 'Lagos Blue Line + Red Line',
  status: 'operational',
  totalKm: 40.0,
  totalStations: 13,
  yearOpened: 2023,
  dailyRidership: 50_000,
  lines: [
    { name: 'Blue Line (Marina-Mile 2)', color: '#0072BA', stations: 5, km: 13.0, yearOpened: 2023 },
    { name: 'Red Line (Oyingbo-Agbadu)', color: '#E5171F', stations: 8, km: 27.0, yearOpened: 2024 },
  ],
  stations: [
    { slug: 'marina-lagos', name: 'Marina', nameKa: 'marina', lat: 6.4281, lng: 3.3926, line: 'Blue Line', citySlug: 'lagos', cc: 'NG', yearOpened: 2023, interchange: false },
    { slug: 'mile-2', name: 'Mile 2', nameKa: 'mile-2', lat: 6.4740, lng: 3.3450, line: 'Blue Line', citySlug: 'lagos', cc: 'NG', yearOpened: 2023, interchange: false },
  ],
}

const addisAbabaMetro: MetroSystemData = {
  citySlug: 'addis-ababa',
  cc: 'ET',
  name: 'Addis Ababa Light Rail',
  status: 'operational',
  totalKm: 31.6,
  totalStations: 39,
  yearOpened: 2015,
  dailyRidership: 120_000,
  lines: [
    { name: 'Line 1 (East-West)', color: '#E5171F', stations: 22, km: 17.4, yearOpened: 2015 },
    { name: 'Line 2 (North-South)', color: '#0072BA', stations: 17, km: 14.2, yearOpened: 2015 },
  ],
  stations: [
    { slug: 'meskel-square', name: 'Meskel Square', nameKa: 'meskel-square', lat: 9.0054, lng: 38.7565, line: 'Line 1 / 2', citySlug: 'addis-ababa', cc: 'ET', yearOpened: 2015, interchange: true },
    { slug: 'st-george', name: 'St George', nameKa: 'st-george', lat: 9.0279, lng: 38.7468, line: 'Line 1 / 2', citySlug: 'addis-ababa', cc: 'ET', yearOpened: 2015, interchange: true },
  ],
}

const johannesburgGautrain: MetroSystemData = {
  citySlug: 'johannesburg',
  cc: 'ZA',
  name: 'Gautrain (Johannesburg-Pretoria)',
  status: 'operational',
  totalKm: 80.0,
  totalStations: 10,
  yearOpened: 2010,
  dailyRidership: 60_000,
  lines: [
    { name: 'Gautrain', color: '#C8102E', stations: 10, km: 80.0, yearOpened: 2010 },
  ],
  stations: [
    { slug: 'sandton', name: 'Sandton', nameKa: 'sandton', lat: -26.1054, lng: 28.0523, line: 'Gautrain', citySlug: 'johannesburg', cc: 'ZA', yearOpened: 2010, interchange: true },
    { slug: 'park-station', name: 'Park Station', nameKa: 'park-station', lat: -26.1976, lng: 28.0436, line: 'Gautrain', citySlug: 'johannesburg', cc: 'ZA', yearOpened: 2010, interchange: true },
    { slug: 'pretoria', name: 'Pretoria', nameKa: 'pretoria', lat: -25.7479, lng: 28.1878, line: 'Gautrain', citySlug: 'johannesburg', cc: 'ZA', yearOpened: 2011, interchange: false },
    { slug: 'o-tembo', name: 'OR Tambo Airport', nameKa: 'or-tambo', lat: -26.1392, lng: 28.2460, line: 'Gautrain', citySlug: 'johannesburg', cc: 'ZA', yearOpened: 2010, interchange: false },
  ],
}

const casablancaTram: MetroSystemData = {
  citySlug: 'casablanca',
  cc: 'MA',
  name: 'Casablanca Tramway',
  status: 'operational',
  totalKm: 50.0,
  totalStations: 70,
  yearOpened: 2012,
  dailyRidership: 200_000,
  lines: [
    { name: 'Line T1', color: '#E5171F', stations: 36, km: 31.0, yearOpened: 2012 },
    { name: 'Line T2', color: '#0072BA', stations: 34, km: 19.0, yearOpened: 2015 },
  ],
  stations: [
    { slug: 'ain-diab', name: 'Ain Diab', nameKa: 'ain-diab', lat: 33.5740, lng: -7.6243, line: 'Line T1', citySlug: 'casablanca', cc: 'MA', yearOpened: 2012, interchange: false },
    { slug: 'sidi-moumen', name: 'Sidi Moumen', nameKa: 'sidi-moumen', lat: 33.5548, lng: -7.5232, line: 'Line T1 / T2', citySlug: 'casablanca', cc: 'MA', yearOpened: 2012, interchange: true },
  ],
}

const algiersMetro: MetroSystemData = {
  citySlug: 'algiers',
  cc: 'DZ',
  name: 'Algiers Metro',
  status: 'operational',
  totalKm: 13.0,
  totalStations: 14,
  yearOpened: 2011,
  dailyRidership: 200_000,
  lines: [
    { name: 'Line 1', color: '#E5171F', stations: 14, km: 13.0, yearOpened: 2011 },
  ],
  stations: [
    { slug: 'toudja', name: 'Toudja El Bahri', nameKa: 'toudja-el-bahri', lat: 36.7538, lng: 3.0588, line: 'Line 1', citySlug: 'algiers', cc: 'DZ', yearOpened: 2011, interchange: false },
    { slug: 'haoudh-hamma', name: 'Haoudh Hamma', nameKa: 'haoudh-hamma', lat: 36.7320, lng: 3.0817, line: 'Line 1', citySlug: 'algiers', cc: 'DZ', yearOpened: 2011, interchange: false },
    { slug: 'hamma', name: 'Hamma', nameKa: 'hamma', lat: 36.7248, lng: 3.0926, line: 'Line 1', citySlug: 'algiers', cc: 'DZ', yearOpened: 2011, interchange: false },
  ],
}

const tunisMetro: MetroSystemData = {
  citySlug: 'tunis',
  cc: 'TN',
  name: 'Tunis Metro Lejer (Light Rail)',
  status: 'operational',
  totalKm: 32.0,
  totalStations: 36,
  yearOpened: 1985,
  dailyRidership: 500_000,
  lines: [
    { name: 'Line 1 (Le Kram-La Goulette)', color: '#E5171F', stations: 14, km: 9.5, yearOpened: 1985 },
    { name: 'Line 2 (Ennasr-Monastir)', color: '#0072BA', stations: 22, km: 22.5, yearOpened: 2005 },
  ],
  stations: [
    { slug: 'republique', name: 'Republique', nameKa: 'republique', lat: 36.8001, lng: 10.1670, line: 'Line 1 / 2', citySlug: 'tunis', cc: 'TN', yearOpened: 1985, interchange: true },
    { slug: 'bab-saadoun', name: 'Bab Saadoun', nameKa: 'bab-saadoun', lat: 36.8074, lng: 10.1532, line: 'Line 2', citySlug: 'tunis', cc: 'TN', yearOpened: 2005, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// OCEANIA
// ────────────────────────────────────────────────────────────────

const sydneyMetro: MetroSystemData = {
  citySlug: 'sydney',
  cc: 'AU',
  name: 'Sydney Metro / Trains',
  status: 'operational',
  totalKm: 160.0,
  totalStations: 130,
  yearOpened: 2019,
  dailyRidership: 900_000,
  lines: [
    { name: 'Sydney Metro NW', color: '#00A1DE', stations: 5, km: 13.0, yearOpened: 2019 },
    { name: 'Sydney Metro City & Southwest', color: '#00A1DE', stations: 7, km: 11.0, yearOpened: 2024 },
    { name: 'T1 North Shore', color: '#E5171F', stations: 31, km: 28.0, yearOpened: 1932 },
    { name: 'T2 Inner West', color: '#009B3A', stations: 22, km: 18.0, yearOpened: 1926 },
    { name: 'T3 Bankstown', color: '#F5D122', stations: 18, km: 16.0, yearOpened: 1890 },
    { name: 'T4 Eastern Suburbs', color: '#0072BA', stations: 28, km: 25.0, yearOpened: 1979 },
    { name: 'T5 Cumberland', color: '#9B26B6', stations: 26, km: 22.0, yearOpened: 1882 },
    { name: 'T7 Olympic Park', color: '#009B3A', stations: 2, km: 2.0, yearOpened: 1998 },
    { name: 'T8 Airport', color: '#00A1DE', stations: 31, km: 25.0, yearOpened: 1990 },
    { name: 'T9 Northern', color: '#E5171F', stations: 26, km: 22.0, yearOpened: 1923 },
  ],
  stations: [
    { slug: 'central-sydney', name: 'Central', nameKa: 'central', lat: -33.8831, lng: 151.2064, line: 'All Trains / Metro', citySlug: 'sydney', cc: 'AU', yearOpened: 1926, interchange: true },
    { slug: 'town-hall', name: 'Town Hall', nameKa: 'town-hall', lat: -33.8736, lng: 151.2068, line: 'All Trains / Metro', citySlug: 'sydney', cc: 'AU', yearOpened: 1932, interchange: true },
    { slug: 'wynyard', name: 'Wynyard', nameKa: 'wynyard', lat: -33.8668, lng: 151.2053, line: 'All Trains', citySlug: 'sydney', cc: 'AU', yearOpened: 1932, interchange: false },
    { slug: 'circular-quay', name: 'Circular Quay', nameKa: 'circular-quay', lat: -33.8612, lng: 151.2106, line: 'All Trains', citySlug: 'sydney', cc: 'AU', yearOpened: 1956, interchange: true },
    { slug: 'barangaroo', name: 'Barangaroo', nameKa: 'barangaroo', lat: -33.8565, lng: 151.2017, line: 'Sydney Metro', citySlug: 'sydney', cc: 'AU', yearOpened: 2024, interchange: false },
    { slug: 'martin-place', name: 'Martin Place', nameKa: 'martin-place', lat: -33.8675, lng: 151.2111, line: 'Sydney Metro', citySlug: 'sydney', cc: 'AU', yearOpened: 2024, interchange: false },
    { slug: 'tarramurra', name: 'Tarramurra', nameKa: 'tarramurra', lat: -33.7411, lng: 151.1441, line: 'Sydney Metro NW', citySlug: 'sydney', cc: 'AU', yearOpened: 2019, interchange: false },
  ],
}

const melbourneMetro: MetroSystemData = {
  citySlug: 'melbourne',
  cc: 'AU',
  name: 'Melbourne Metro / Trains',
  status: 'operational',
  totalKm: 160.0,
  totalStations: 218,
  yearOpened: 1854,
  dailyRidership: 800_000,
  lines: [
    { name: 'Craigieburn', color: '#009B3A', stations: 16, km: 26.0, yearOpened: 1854 },
    { name: 'Upfield', color: '#009B3A', stations: 13, km: 18.0, yearOpened: 1860 },
    { name: 'Sunbury', color: '#009B3A', stations: 15, km: 33.0, yearOpened: 1859 },
    { name: 'Werribee', color: '#009B3A', stations: 14, km: 32.0, yearOpened: 1857 },
    { name: 'Williamstown', color: '#009B3A', stations: 7, km: 14.0, yearOpened: 1859 },
    { name: 'Frankston', color: '#E5171F', stations: 18, km: 43.0, yearOpened: 1881 },
    { name: 'Pakenham', color: '#0072BA', stations: 16, km: 45.0, yearOpened: 1877 },
    { name: 'Cranbourne', color: '#0072BA', stations: 15, km: 40.0, yearOpened: 1888 },
    { name: 'Hurstbridge', color: '#E5171F', stations: 22, km: 38.0, yearOpened: 1861 },
    { name: 'Belgrave/Lilydale', color: '#F5D122', stations: 22, km: 42.0, yearOpened: 1861 },
    { name: 'Alamein', color: '#F5D122', stations: 8, km: 10.0, yearOpened: 1888 },
    { name: 'Glen Waverley', color: '#F5D122', stations: 10, km: 13.0, yearOpened: 1880 },
    { name: 'Sandringham', color: '#9B26B6', stations: 9, km: 15.0, yearOpened: 1861 },
    { name: 'Stony Point', color: '#9B26B6', stations: 5, km: 23.0, yearOpened: 1941 },
  ],
  stations: [
    { slug: 'flinders-street', name: 'Flinders Street', nameKa: 'flinders-street', lat: -37.8183, lng: 144.9716, line: 'All Lines', citySlug: 'melbourne', cc: 'AU', yearOpened: 1909, interchange: true },
    { slug: 'southern-cross', name: 'Southern Cross', nameKa: 'southern-cross', lat: -37.8188, lng: 144.9530, line: 'All Lines', citySlug: 'melbourne', cc: 'AU', yearOpened: 1909, interchange: true },
    { slug: 'richmond', name: 'Richmond', nameKa: 'richmond', lat: -37.8232, lng: 144.9891, line: 'All Lines', citySlug: 'melbourne', cc: 'AU', yearOpened: 1859, interchange: true },
    { slug: 'parliament', name: 'Parliament', nameKa: 'parliament', lat: -37.8131, lng: 144.9743, line: 'All Lines', citySlug: 'melbourne', cc: 'AU', yearOpened: 1985, interchange: true },
    { slug: 'north-melbourne', name: 'North Melbourne', nameKa: 'north-melbourne', lat: -37.8009, lng: 144.9422, line: 'All Lines', citySlug: 'melbourne', cc: 'AU', yearOpened: 1859, interchange: true },
  ],
}

const perthTransperth: MetroSystemData = {
  citySlug: 'perth',
  cc: 'AU',
  name: 'Perth Transperth',
  status: 'operational',
  totalKm: 180.0,
  totalStations: 88,
  yearOpened: 1899,
  dailyRidership: 300_000,
  lines: [
    { name: 'Fremantle Line', color: '#E5171F', stations: 17, km: 21.0, yearOpened: 1886 },
    { name: 'Armadale Line', color: '#009B3A', stations: 22, km: 30.0, yearOpened: 1899 },
    { name: 'Midland Line', color: '#F5D122', stations: 14, km: 26.0, yearOpened: 1886 },
    { name: 'Joondalup Line', color: '#0072BA', stations: 13, km: 30.0, yearOpened: 1992 },
    { name: 'Mandurah Line', color: '#9B26B6', stations: 11, km: 35.0, yearOpened: 2007 },
    { name: 'Airport Line', color: '#00A1DE', stations: 4, km: 9.0, yearOpened: 2022 },
  ],
  stations: [
    { slug: 'perth-station', name: 'Perth', nameKa: 'perth', lat: -31.9522, lng: 115.8590, line: 'All Lines', citySlug: 'perth', cc: 'AU', yearOpened: 1899, interchange: true },
    { slug: 'city-west', name: 'City West', nameKa: 'city-west', lat: -31.9493, lng: 115.8501, line: 'All Lines', citySlug: 'perth', cc: 'AU', yearOpened: 1992, interchange: true },
    { slug: 'esplanade', name: 'Esplanade', nameKa: 'esplanade', lat: -31.9570, lng: 115.8610, line: 'All Lines', citySlug: 'perth', cc: 'AU', yearOpened: 1992, interchange: true },
  ],
}

const aucklandCRL: MetroSystemData = {
  citySlug: 'auckland',
  cc: 'NZ',
  name: 'Auckland City Rail Link',
  status: 'under-construction',
  totalKm: 3.4,
  totalStations: 3,
  yearOpened: 2026,
  dailyRidership: 0,
  lines: [
    { name: 'City Rail Link', color: '#0072BA', stations: 3, km: 3.4, yearOpened: 2026 },
  ],
  stations: [
    { slug: 'britomart', name: 'Britomart', nameKa: 'britomart', lat: -36.8442, lng: 174.7663, line: 'CRL', citySlug: 'auckland', cc: 'NZ', yearOpened: 2003, interchange: true },
    { slug: 'Aotea', name: 'Aotea', nameKa: 'aotea', lat: -36.8480, lng: 174.7625, line: 'CRL', citySlug: 'auckland', cc: 'NZ', yearOpened: 2026, interchange: false },
    { slug: 'king-street', name: 'Karangahape', nameKa: 'karangahape', lat: -36.8559, lng: 174.7567, line: 'CRL', citySlug: 'auckland', cc: 'NZ', yearOpened: 2026, interchange: false },
  ],
}

// ────────────────────────────────────────────────────────────────
// COMBINED EXPORT
// ────────────────────────────────────────────────────────────────

export const WORLD_METROS: MetroSystemData[] = [
  // Asia — Japan
  tokyoMetro,
  tokyoToei,
  jrYamanote,
  // Asia — South Korea
  seoulMetro,
  // Asia — China
  beijingMetro,
  shanghaiMetro,
  guangzhouMetro,
  shenzhenMetro,
  chengduMetro,
  wuhanMetro,
  hangzhouMetro,
  nanjingMetro,
  // Asia — Hong Kong
  hongKongMTR,
  // Asia — Singapore
  singaporeMRT,
  // Asia — Taiwan
  taipeiMRT,
  // Asia — Malaysia
  kualaLumpurMRT,
  // Asia — Thailand
  bangkokMetro,
  // Asia — India
  delhiMetro,
  mumbaiMetro,
  chennaiMetro,
  kolkataMetro,
  bangaloreMetro,
  hyderabadMetro,
  puneMetro,
  // Asia — Southeast Asia
  manilaMetro,
  hanoiMetro,
  hoChiMinhCityMetro,
  // Asia — South Asia
  dhakaMetro,
  karachiMetro,
  lahoreMetro,
  // Asia — Central Asia
  almatyMetro,
  tashkentMetro,
  // Asia — Middle East
  dubaiMetro,
  dohaMetro,
  riyadhMetro,
  // Asia — Turkey
  istanbulMetro,
  ankaraMetro,
  izmirMetro,
  // Asia — Israel
  telAvivMetro,
  // Europe — UK
  londonTube,
  // Europe — France
  parisMetro,
  // Europe — Germany
  berlinMetro,
  munichMetro,
  hamburgMetro,
  frankfurtMetro,
  cologneMetro,
  stuttgartMetro,
  // Europe — Spain
  madridMetro,
  barcelonaMetro,
  valenciaMetro,
  bilbaoMetro,
  sevilleMetro,
  // Europe — Italy
  romeMetro,
  milanMetro,
  naplesMetro,
  turinMetro,
  // Europe — Russia
  moscowMetro,
  stPetersburgMetro,
  // Europe — Other
  viennaMetro,
  pragueMetro,
  warsawMetro,
  budapestMetro,
  bucharestMetro,
  athensMetro,
  lisbonMetro,
  portoMetro,
  dublinLuas,
  stockholmMetro,
  copenhagenMetro,
  osloMetro,
  helsinkiMetro,
  zurichSbahn,
  genevaMetro,
  // Americas — North America
  nycSubway,
  washingtonDC,
  bostonT,
  chicagoL,
  sanFranciscoBART,
  laMetro,
  philadelphiaSEPTA,
  miamiMetrorail,
  atlantaMARTA,
  torontoTTC,
  montrealMetro,
  vancouverSkyTrain,
  // Americas — Latin America
  mexicoCityMetro,
  buenosAiresSubte,
  santiagoMetro,
  saoPauloMetro,
  rioMetro,
  bogotaMetro,
  limaMetro,
  medellinMetro,
  panamaCityMetro,
  santoDomingoMetro,
  sanJuanTren,
  // Africa
  cairoMetro,
  lagosMetro,
  addisAbabaMetro,
  johannesburgGautrain,
  casablancaTram,
  algiersMetro,
  tunisMetro,
  // Oceania
  sydneyMetro,
  melbourneMetro,
  perthTransperth,
  aucklandCRL,
]

export const getMetroByCity = (citySlug: string): MetroSystemData | undefined =>
  WORLD_METROS.find((m) => m.citySlug === citySlug)

export const getMetrosByCountry = (cc: string): MetroSystemData[] =>
  WORLD_METROS.filter((m) => m.cc === cc)

export const getMetroSystems = (): MetroSystemData[] => WORLD_METROS
