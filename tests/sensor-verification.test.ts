import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity environment
const mockClarity = {
  tx: {
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Admin address
    setSender: function(sender) {
      this.sender = sender;
    }
  },
  blockHeight: 100,
  setBlockHeight: function(height) {
    this.blockHeight = height;
  }
};

// Mock the contract
const sensorVerification = {
  admin: mockClarity.tx.sender,
  verifiedSensors: new Map(),
  
  registerSensor: function(sensorId, location, sensorType) {
    if (mockClarity.tx.sender !== this.admin) {
      return { type: 'err', value: 403 };
    }
    
    this.verifiedSensors.set(sensorId, {
      owner: mockClarity.tx.sender,
      location,
      sensorType,
      isActive: true,
      lastVerified: mockClarity.blockHeight
    });
    
    return { type: 'ok', value: true };
  },
  
  verifySensor: function(sensorId) {
    if (mockClarity.tx.sender !== this.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (!this.verifiedSensors.has(sensorId)) {
      return { type: 'err', value: 404 };
    }
    
    const sensor = this.verifiedSensors.get(sensorId);
    sensor.lastVerified = mockClarity.blockHeight;
    this.verifiedSensors.set(sensorId, sensor);
    
    return { type: 'ok', value: true };
  },
  
  deactivateSensor: function(sensorId) {
    if (mockClarity.tx.sender !== this.admin) {
      return { type: 'err', value: 403 };
    }
    
    if (!this.verifiedSensors.has(sensorId)) {
      return { type: 'err', value: 404 };
    }
    
    const sensor = this.verifiedSensors.get(sensorId);
    sensor.isActive = false;
    this.verifiedSensors.set(sensorId, sensor);
    
    return { type: 'ok', value: true };
  },
  
  isSensorVerified: function(sensorId) {
    if (!this.verifiedSensors.has(sensorId)) {
      return false;
    }
    
    const sensor = this.verifiedSensors.get(sensorId);
    return sensor.isActive &&
        (mockClarity.blockHeight - sensor.lastVerified) < 10000;
  },
  
  getSensorDetails: function(sensorId) {
    return this.verifiedSensors.get(sensorId) || null;
  },
  
  transferAdmin: function(newAdmin) {
    if (mockClarity.tx.sender !== this.admin) {
      return { type: 'err', value: 403 };
    }
    
    this.admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Sensor Verification Contract', () => {
  beforeEach(() => {
    // Reset the contract state
    sensorVerification.admin = mockClarity.tx.sender;
    sensorVerification.verifiedSensors = new Map();
    mockClarity.tx.setSender('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    mockClarity.setBlockHeight(100);
  });
  
  it('should register a new sensor', () => {
    const result = sensorVerification.registerSensor(
        'sensor-123',
        'Downtown',
        'PM2.5'
    );
    
    expect(result.type).toBe('ok');
    expect(sensorVerification.verifiedSensors.has('sensor-123')).toBe(true);
    
    const sensor = sensorVerification.getSensorDetails('sensor-123');
    expect(sensor.location).toBe('Downtown');
    expect(sensor.sensorType).toBe('PM2.5');
    expect(sensor.isActive).toBe(true);
    expect(sensor.lastVerified).toBe(100);
  });
  
  it('should not allow non-admin to register a sensor', () => {
    mockClarity.tx.setSender('ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    const result = sensorVerification.registerSensor(
        'sensor-123',
        'Downtown',
        'PM2.5'
    );
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(403);
    expect(sensorVerification.verifiedSensors.has('sensor-123')).toBe(false);
  });
  
});
