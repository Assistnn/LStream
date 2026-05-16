import Foundation
import MediaPlayer

@objc(RemoteCommandModule)
class RemoteCommandModule: NSObject {
  private let commandCenter = MPRemoteCommandCenter.shared()
  private var nextTrackTarget: Any?
  private var previousTrackTarget: Any?

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc
  func configure(_ skipInterval: Double) {
    commandCenter.skipForwardCommand.preferredIntervals = [NSNumber(value: skipInterval)]
    commandCenter.skipBackwardCommand.preferredIntervals = [NSNumber(value: skipInterval)]

    if let target = nextTrackTarget {
      commandCenter.nextTrackCommand.removeTarget(target)
    }
    if let target = previousTrackTarget {
      commandCenter.previousTrackCommand.removeTarget(target)
    }

    commandCenter.nextTrackCommand.isEnabled = true
    nextTrackTarget = commandCenter.nextTrackCommand.addTarget { _ in
      NotificationCenter.default.post(name: NSNotification.Name("RemoteNextTrack"), object: nil)
      return .success
    }

    commandCenter.previousTrackCommand.isEnabled = true
    previousTrackTarget = commandCenter.previousTrackCommand.addTarget { _ in
      NotificationCenter.default.post(name: NSNotification.Name("RemotePreviousTrack"), object: nil)
      return .success
    }
  }
}
