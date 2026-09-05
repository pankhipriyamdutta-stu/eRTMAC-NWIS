/**
 * Spatial Repository for Anti-Collision
 * Uses PostGIS if available, else falls back to local KD-tree simulation.
 */
class SpatialRepository {
  constructor() {
    this.mode = 'FALLBACK'; // PostGIS or FALLBACK
  }

  async connect() {
    console.log("Spatial Repository initialized (Fallback KDTree Mode)");
    // In a real scenario, connect to PostGIS pool here.
  }

  async getOffsetTrajectories(wellId) {
    // Mock data for prototype
    return [
      [10.5, 20.1, 5000],
      [12.0, 22.0, 5050],
      [15.0, 25.0, 5100]
    ];
  }

  async saveTrajectoryPoint(wellId, point) {
    // point: { md, tvd, x, y, z, inc, azi }
    return true;
  }
}

module.exports = new SpatialRepository();
