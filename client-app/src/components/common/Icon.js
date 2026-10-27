import React from 'react';
import Svg, { Path } from 'react-native-svg';
import * as Lucide from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

// Server module icon names (RBAC catalog) -> lucide names. Same set the website uses.
const ALIASES = {
    Sliders: ['SlidersHorizontal', 'Sliders'],
    BarChart3: ['ChartColumn', 'BarChart3'],
    FolderTree: ['FolderTree', 'Folder'],
    Hospital: ['Hospital', 'Building2'],
    Sparkles: ['Sparkles'],
    UserCog: ['UserCog', 'UserRoundCog', 'Users'],
    Stethoscope: ['Stethoscope', 'Activity'],
    Warning: ['TriangleAlert', 'AlertTriangle'],
    Close: ['X'],
    Check: ['Check'],
};

const ToothIcon = ({ size, color, strokeWidth }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M7.5 3C5 3 3.5 5 3.5 7.5c0 2 .8 3.2 1.4 5.6.5 2.3.9 7.9 2.6 7.9 1.4 0 1.4-4 3-4h3c1.6 0 1.6 4 3 4 1.7 0 2.1-5.6 2.6-7.9.6-2.4 1.4-3.6 1.4-5.6C20.5 5 19 3 16.5 3c-1.7 0-2.6 1-4.5 1S9.2 3 7.5 3z" />
    </Svg>
);

export const Icon = ({ name, size = 20, color = COLORS.primary, strokeWidth = 2, style }) => {
    if (name === 'Tooth') {
        return <ToothIcon size={size} color={color} strokeWidth={strokeWidth} />;
    }
    const candidates = [...(ALIASES[name] || []), name, 'Boxes'];
    const Cmp = candidates.map((n) => Lucide[n]).find(Boolean);
    return Cmp ? <Cmp size={size} color={color} strokeWidth={strokeWidth} style={style} /> : null;
};

export default Icon;
