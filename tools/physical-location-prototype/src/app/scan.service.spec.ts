import { TestBed } from '@angular/core/testing';
import { CollectionService } from './collection.service';
import { NavigationService } from './navigation.service';
import { ScanService, SCAN_MODE } from './scan.service';

describe('ScanService', () => {
  function scanService(): ScanService {
    return TestBed.inject(ScanService);
  }

  function collectionService(): CollectionService {
    return TestBed.inject(CollectionService);
  }

  function findActiveItem(): ReturnType<CollectionService['dataset']>['items'][number] {
    const dataset = collectionService().dataset();
    const item = dataset.items.find((candidate) => candidate.status === 'active' && candidate.locationId);
    if (!item) {
      throw new Error('No active stored item found in demo dataset');
    }
    return item;
  }

  function findCheckedOutItem(): ReturnType<CollectionService['dataset']>['items'][number] {
    const dataset = collectionService().dataset();
    const item = dataset.items.find((candidate) => candidate.status === 'checked_out');
    if (!item) {
      throw new Error('No checked-out item found in demo dataset');
    }
    return item;
  }

  function findStorageLocation(): ReturnType<CollectionService['dataset']>['locations'][number] {
    const dataset = collectionService().dataset();
    const location = dataset.locations.find(
      (candidate) => candidate.type === 'position' || candidate.type === 'tray' || candidate.type === 'box',
    );
    if (!location) {
      throw new Error('No valid storage location found in demo dataset');
    }
    return location;
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    // Reset scan state in case a previous test left it behind.
    const service = scanService();
    service.setScanMode(SCAN_MODE.extract);
  });

  it('records the last extracted item and clears it on rescan', () => {
    const service = scanService();
    const item = findActiveItem();

    service.scanQr(item.catalogueNumber);

    expect(service.lastExtractedItem()?.id).toBe(item.id);
    expect(service.lastExtractedItem()?.catalogue).toBe(item.catalogueNumber);

    service.rescanItem();

    expect(service.lastExtractedItem()).toBeNull();
  });

  it('in place mode selects an item then completes the place with a destination', () => {
    const service = scanService();
    service.setScanMode(SCAN_MODE.place);
    const item = findCheckedOutItem();
    const location = findStorageLocation();

    service.scanQr(item.catalogueNumber);

    expect(service.placePending()?.itemId).toBe(item.id);
    expect(service.placePending()?.step).toBe('destination');

    service.scanQr(location.id);

    expect(service.placePending()).toBeNull();
    expect(service.completedPlace()?.itemId).toBe(item.id);
    expect(service.completedPlace()?.destinationId).toBe(location.id);
  });

  it('resets only the destination when rescanning destination after a completed place', () => {
    const service = scanService();
    service.setScanMode(SCAN_MODE.place);
    const item = findCheckedOutItem();
    const location = findStorageLocation();
    service.scanQr(item.catalogueNumber);
    service.scanQr(location.id);

    service.rescanDestination();

    expect(service.completedPlace()).toBeNull();
    expect(service.placePending()?.itemId).toBe(item.id);
    expect(service.placePending()?.step).toBe('destination');
  });

  it('clears place state when rescanning the item during a place flow', () => {
    const service = scanService();
    service.setScanMode(SCAN_MODE.place);
    const item = findCheckedOutItem();
    service.scanQr(item.catalogueNumber);

    service.rescanItem();

    expect(service.placePending()).toBeNull();
    expect(service.completedPlace()).toBeNull();
  });

  it('clears scan feedback state when switching modes', () => {
    const service = scanService();
    const item = findActiveItem();
    service.scanQr(item.catalogueNumber);
    expect(service.lastExtractedItem()).not.toBeNull();

    service.setScanMode(SCAN_MODE.place);

    expect(service.lastExtractedItem()).toBeNull();
  });

  it('keeps the operation type of a recorded warning when the scan mode changes', () => {
    const service = scanService();
    service.setScanMode(SCAN_MODE.place);

    service.scanQr('unknown-code');

    expect(service.recentWarnings()[0]?.type).toBe(SCAN_MODE.place);

    service.setScanMode(SCAN_MODE.extract);

    expect(service.recentWarnings()[0]?.type).toBe(SCAN_MODE.place);
  });
});
