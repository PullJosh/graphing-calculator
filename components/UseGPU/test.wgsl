@optional @link fn getID(i: u32) -> u32 { return 0u; };
@optional @link fn getIndex(i: u32) -> u32 { return 0u; };

@export fn getPickingID(index: u32) -> vec2<u32> {
  return vec2<u32>(getID(index), getIndex(index));
}
