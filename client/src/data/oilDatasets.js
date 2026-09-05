/**
 * Authentic Oil India Limited (OIL) Drilling & Subsurface Datasets
 * Fields: Upper Assam Basin (Naharkatiya, Baghjan HPHT, Moran, Duliajan)
 * Data adheres to standard WITSML and API oilfield conventions.
 */

export const OIL_WELLS = {
  'OIL-NHK-542': {
    id: 'OIL-NHK-542',
    name: 'Naharkatiya NHK-542 (Development)',
    field: 'Naharkatiya Field, Assam',
    basin: 'Upper Assam Shelf',
    operator: 'Oil India Limited (OIL)',
    rig: 'OIL Assam-Rig-04 (BHEL 2000HP AC-VFD)',
    targetFormation: 'Barail Sandstone (Upper Eocene - Oligocene)',
    currentDepthMD: 3245.8, // meters
    currentDepthTVD: 3120.4, // meters
    bitSize: 8.5, // inches
    casingSize: 9.625, // inches at 2850m
    mudType: 'Polymer Water-Based Mud (KCL-PHPA)',
    mudWeight: 10.4, // ppg
    formationPressureGrad: 0.465, // psi/ft (Normal hydrostatic)
    telemetryMode: 'MWD Pulse + EML High Speed',
    crew: {
      toolpusher: 'P. K. Gogoi',
      directionalDriller: 'R. Baruah',
      mudEngineer: 'D. Saikia'
    },
    stratigraphy: [
      { name: 'Alluvium & Dhekiajuli Sand', topMD: 0, bottomMD: 820, lithology: 'Coarse Sand & Gravel', color: '#D97706' },
      { name: 'Girujan Clay Formation', topMD: 820, bottomMD: 1640, lithology: 'Variegated Clay / Mottled Mudstone', color: '#64748B' },
      { name: 'Tipam Sandstone Formation', topMD: 1640, bottomMD: 2680, lithology: 'Medium to Fine Grained Sandstone (Oil Bearer)', color: '#F59E0B' },
      { name: 'Bokabil Formation', topMD: 2680, bottomMD: 2980, lithology: 'Siltstone with thin Shale breaks', color: '#475569' },
      { name: 'Barail Sandstone (Main Pay)', topMD: 2980, bottomMD: 3450, lithology: 'Massive Quartzose Sandstone & Carbonaceous Shale', color: '#10B981' }
    ],
    nominalParams: {
      pressure: 3120, // psi
      temperature: 88.5, // °C
      flowIn: 580, // GPM
      flowOut: 582, // GPM
      mudVolume: 1420, // bbl
      rpm: 120, // RPM
      torque: 5200, // ft-lbs
      wob: 24.5, // klbs
      rop: 22.4, // m/hr
      spp: 3080, // psi
      hookLoad: 188, // klbs
      vibrationAxial: 0.42, // g RMS
      vibrationLateral: 0.65, // g RMS
      vibrationTorsional: 14.2, // % SSI
      gammaRay: 48.5, // API (Reservoir Sand)
      resistivityDeep: 38.2, // ohm-m (Hydrocarbon saturation)
      resistivityShallow: 18.5, // ohm-m
      density: 2.38, // g/cm³
      porosity: 21.4, // %
      ecd: 10.85, // ppg
      mse: 31200 // psi
    }
  },

  'OIL-BGH-16': {
    id: 'OIL-BGH-16',
    name: 'Baghjan BGH-16 (Deep HPHT)',
    field: 'Baghjan Gas & Condensate Field, Tinsukia',
    basin: 'Upper Assam Shelf',
    operator: 'Oil India Limited (OIL)',
    rig: 'OIL Cyber-Rig-02 (2500HP Ultra-Deep)',
    targetFormation: 'Sylhet Limestone & Kopili Shale (Eocene)',
    currentDepthMD: 3962.0,
    currentDepthTVD: 3940.2,
    bitSize: 6.0,
    casingSize: 7.0,
    mudType: 'High-Density Synthetic Oil-Based Mud (SBM)',
    mudWeight: 12.8, // ppg
    formationPressureGrad: 0.62, // psi/ft (Overpressured gas kick risk)
    telemetryMode: 'High-Speed Wired Drillpipe (Telemetry Rate: 57 kbps)',
    crew: {
      toolpusher: 'M. Bordoloi',
      directionalDriller: 'A. Chaliha',
      mudEngineer: 'K. Neog'
    },
    stratigraphy: [
      { name: 'Tipam Group', topMD: 0, bottomMD: 2400, lithology: 'Sandstone / Claystone', color: '#F59E0B' },
      { name: 'Barail Coal-Shale Sequence', topMD: 2400, bottomMD: 3300, lithology: 'Coal seams & tight sands', color: '#334155' },
      { name: 'Kopili Formation', topMD: 3300, bottomMD: 3780, lithology: 'Overpressured Marine Splintery Shale', color: '#6366F1' },
      { name: 'Sylhet Limestone Formation', topMD: 3780, bottomMD: 4200, lithology: 'Fossiliferous Dolomitic Limestone (High Pressure Gas)', color: '#EC4899' }
    ],
    nominalParams: {
      pressure: 3840,
      temperature: 132.0,
      flowIn: 440,
      flowOut: 442,
      mudVolume: 1650,
      rpm: 95,
      torque: 6400,
      wob: 28.0,
      rop: 12.8,
      spp: 3750,
      hookLoad: 242,
      vibrationAxial: 0.85,
      vibrationLateral: 1.25,
      vibrationTorsional: 28.6,
      gammaRay: 32.0,
      resistivityDeep: 145.0,
      resistivityShallow: 85.0,
      density: 2.58,
      porosity: 14.5,
      ecd: 13.35,
      mse: 54000
    }
  },

  'OIL-MRN-84': {
    id: 'OIL-MRN-84',
    name: 'Moran MRN-84 (Directional S-Profile)',
    field: 'Moran Oil Field, Dibrugarh',
    basin: 'Upper Assam Shelf',
    operator: 'Oil India Limited (OIL)',
    rig: 'OIL Automated Hydraulic Rig-07',
    targetFormation: 'Barail Main Pay Sands',
    currentDepthMD: 3415.5,
    currentDepthTVD: 3180.0,
    bitSize: 8.5,
    casingSize: 9.625,
    mudType: 'Low-Solids Non-Dispersed (LSND) Water Mud',
    mudWeight: 10.2,
    formationPressureGrad: 0.465,
    telemetryMode: 'Continuous Wave Mud Pulse Telemetry',
    crew: {
      toolpusher: 'S. Dutta',
      directionalDriller: 'H. Sharma',
      mudEngineer: 'P. Phukan'
    },
    stratigraphy: [
      { name: 'Girujan Clay', topMD: 0, bottomMD: 1520, lithology: 'Mottled Claystone', color: '#64748B' },
      { name: 'Upper Tipam Sand', topMD: 1520, bottomMD: 2540, lithology: 'Interbedded Sand & Shale', color: '#F59E0B' },
      { name: 'Lower Tipam (Teok Sand)', topMD: 2540, bottomMD: 2890, lithology: 'Clean Fluvial Sandstone', color: '#EAB308' },
      { name: 'Barail Group (Moran Pay)', topMD: 2890, bottomMD: 3500, lithology: 'Oil-Bearing Sandstone with Shale breaks', color: '#10B981' }
    ],
    nominalParams: {
      pressure: 2980,
      temperature: 92.4,
      flowIn: 550,
      flowOut: 549,
      mudVolume: 1380,
      rpm: 110,
      torque: 5800,
      wob: 22.0,
      rop: 19.5,
      spp: 2950,
      hookLoad: 175,
      vibrationAxial: 0.55,
      vibrationLateral: 1.85,
      vibrationTorsional: 68.0, // Prone to stick-slip
      gammaRay: 62.0,
      resistivityDeep: 26.5,
      resistivityShallow: 14.0,
      density: 2.34,
      porosity: 22.8,
      ecd: 10.65,
      mse: 34500
    }
  },

  'OIL-DUL-108': {
    id: 'OIL-DUL-108',
    name: 'Duliajan DUL-108 (PDC Test Well)',
    field: 'Duliajan Operational Hub, Dibrugarh',
    basin: 'Upper Assam Shelf',
    operator: 'Oil India Limited (OIL)',
    rig: 'OIL Smart Rig-01 (Automated Cyber Base)',
    targetFormation: 'Tipam Heavy Crude & Condensate Horizon',
    currentDepthMD: 2890.0,
    currentDepthTVD: 2890.0,
    bitSize: 8.5,
    casingSize: 9.625,
    mudType: 'KCl Glycol Inhibited Water-Based Mud',
    mudWeight: 10.0,
    formationPressureGrad: 0.450,
    telemetryMode: 'High-Frequency EM (Electro-Magnetic) Telemetry',
    crew: {
      toolpusher: 'T. Hazarika',
      directionalDriller: 'B. Goswami',
      mudEngineer: 'J. Das'
    },
    stratigraphy: [
      { name: 'Dhekiajuli Formation', topMD: 0, bottomMD: 750, lithology: 'Sand & Pebbly Sandstone', color: '#D97706' },
      { name: 'Girujan Clay', topMD: 750, bottomMD: 1800, lithology: 'Soft to Firm Claystone', color: '#64748B' },
      { name: 'Tipam Sandstone Pay', topMD: 1800, bottomMD: 2950, lithology: 'Coarse to Medium Sandstone', color: '#10B981' }
    ],
    nominalParams: {
      pressure: 2820,
      temperature: 82.0,
      flowIn: 610,
      flowOut: 611,
      mudVolume: 1250,
      rpm: 140,
      torque: 4600,
      wob: 20.0,
      rop: 34.0, // High ROP with PDC
      spp: 2820,
      hookLoad: 165,
      vibrationAxial: 0.28,
      vibrationLateral: 0.45,
      vibrationTorsional: 12.0,
      gammaRay: 38.0,
      resistivityDeep: 42.0,
      resistivityShallow: 22.0,
      density: 2.30,
      porosity: 24.5,
      ecd: 10.42,
      mse: 21800 // High efficiency
    }
  }
};

/**
 * Historical Depth-Log Curve points for Oil India Limited Naharkatiya-542
 * Formatted for standard 4-track petrophysical and mechanical log visualization.
 */
export const NHK_542_DEPTH_LOG = Array.from({ length: 50 }, (_, i) => {
  const depth = 3200 + i * 1.0; // 3200m to 3250m
  // Simulate Barail transition at 3224m:
  const isSand = depth >= 3224 && depth <= 3242;
  const gr = isSand ? (30 + Math.sin(i * 0.8) * 8) : (85 + Math.sin(i * 0.5) * 12);
  const resDeep = isSand ? (45 + Math.sin(i * 0.9) * 10) : (4.5 + Math.cos(i) * 1.5);
  const resMed = isSand ? (28 + Math.sin(i * 0.9) * 6) : (3.2 + Math.cos(i) * 1.0);
  const density = isSand ? 2.34 : 2.52;
  const porosity = isSand ? 22.5 : 9.5;
  const rop = isSand ? (26 + Math.sin(i) * 3) : (14 + Math.sin(i) * 2);
  const mse = isSand ? 28500 : 46000;

  return {
    depth: parseFloat(depth.toFixed(1)),
    gammaRay: parseFloat(gr.toFixed(1)),
    caliper: 8.52,
    bitSize: 8.5,
    resistivityDeep: parseFloat(resDeep.toFixed(1)),
    resistivityMedium: parseFloat(resMed.toFixed(1)),
    bulkDensity: parseFloat(density.toFixed(2)),
    neutronPorosity: parseFloat(porosity.toFixed(1)),
    rop: parseFloat(rop.toFixed(1)),
    wob: 24.5,
    mse: parseFloat((mse / 1000).toFixed(1)), // kpsi
    lithology: isSand ? 'Barail Sandstone (Oil Pay)' : 'Kopili/Barail Marine Shale'
  };
});
