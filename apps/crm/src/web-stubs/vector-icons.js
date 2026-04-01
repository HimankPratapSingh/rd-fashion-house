// Web stub for react-native-vector-icons
import React from 'react';
import { Text } from 'react-native';
const Icon = ({ name, size, color }) => React.createElement(Text, { style: { fontSize: size, color } }, name);
export default Icon;
export const MaterialIcons = Icon;
export const Ionicons = Icon;
export const FontAwesome = Icon;
export const AntDesign = Icon;
